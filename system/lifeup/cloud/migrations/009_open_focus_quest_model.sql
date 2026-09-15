-- Open/focus quest model v1.
-- Lifecycle and execution attention are separate axes:
--   ACTIVE = non-terminal/open Quest v2 lifecycle state (many may coexist)
--   quest.focused = append-only selection of at most one OPEN Quest v2 for execution attention
-- Historical quest events are never rewritten. If no explicit focus event exists, projection code
-- preserves legacy behavior by inferring the earliest still-open Quest v2 as focus.

-- Retire the coarse global one-active-Quest-v2 gate installed by migration 006.
DROP TRIGGER IF EXISTS zzz_system_events_player_focus_v2 ON system_events;

-- Migration 005 routes its Quest-v2-only event types around the original 002 validator.
-- quest.focused is now validated by the dedicated focus validator below, so keep every
-- legacy event on the original validator while routing only this new type around it.
DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN ('quest.progressed','quest.revealed','quest.failed','quest.expired','quest.focused'))
  EXECUTE FUNCTION system_validate_event_insert();

CREATE OR REPLACE FUNCTION system_validate_quest_focus_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
  v_created jsonb;
  v_latest_focus text;
BEGIN
  -- Serialize explicit focus changes with quest terminalization so focus cannot race a close.
  PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:execution-focus', 0));

  IF NEW.event_type <> 'quest.focused' THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.payload) <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;
  IF NEW.claim_status <> 'derived' THEN
    RAISE EXCEPTION 'quest.focused must be derived';
  END IF;
  IF btrim(COALESCE(NEW.actor,'')) = '' OR length(NEW.actor) > 80 THEN
    RAISE EXCEPTION 'actor is required and must be <= 80 chars';
  END IF;
  IF btrim(COALESCE(NEW.source,'')) = '' OR length(NEW.source) > 80 THEN
    RAISE EXCEPTION 'source is required and must be <= 80 chars';
  END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref) > 500 THEN
    RAISE EXCEPTION 'source_ref must be <= 500 chars';
  END IF;
  IF length(NEW.idempotency_key) < 8 OR length(NEW.idempotency_key) > 200 THEN
    RAISE EXCEPTION 'idempotency_key must be 8..200 chars';
  END IF;
  IF btrim(COALESCE(NEW.request_hash,'')) = '' THEN
    RAISE EXCEPTION 'request_hash is required';
  END IF;

  v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
  IF v_quest_id = '' OR length(v_quest_id) > 100 THEN
    RAISE EXCEPTION 'quest_id is required and must be <= 100 chars';
  END IF;
  IF length(COALESCE(NEW.payload->>'reason','')) > 500 THEN
    RAISE EXCEPTION 'focus reason must be <= 500 chars';
  END IF;

  SELECT e.payload INTO v_created
  FROM system_events e
  WHERE e.event_type='quest.created'
    AND e.payload->>'quest_id'=v_quest_id
  ORDER BY e.seq ASC
  LIMIT 1;

  IF v_created IS NULL THEN
    RAISE EXCEPTION 'quest does not exist';
  END IF;
  IF COALESCE(v_created->>'quest_version','') <> '2' THEN
    RAISE EXCEPTION 'quest.focus requires a Quest v2 quest';
  END IF;
  IF EXISTS (
    SELECT 1 FROM system_events e
    WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
      AND e.payload->>'quest_id'=v_quest_id
  ) THEN
    RAISE EXCEPTION 'quest is not active';
  END IF;

  SELECT e.payload->>'quest_id' INTO v_latest_focus
  FROM system_events e
  WHERE e.event_type='quest.focused'
  ORDER BY e.seq DESC
  LIMIT 1;

  IF v_latest_focus = v_quest_id
     AND NOT EXISTS (
       SELECT 1 FROM system_events t
       WHERE t.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
         AND t.payload->>'quest_id'=v_latest_focus
     ) THEN
    RAISE EXCEPTION 'quest is already focused';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_system_events_focus_model_v1 ON system_events;
CREATE TRIGGER zzz_system_events_focus_model_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='quest.focused' OR NEW.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired'))
  EXECUTE FUNCTION system_validate_quest_focus_v1();

-- Preserve the existing Timing v2 / Quest v2 public action gate as the inner implementation.
DO $install_focus_v1_inner$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;

  IF position('system_apply_action_focus_v1_inner' IN v_def) = 0 THEN
    v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_focus_v1_inner(');
    IF v_new_def = v_def THEN
      v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_focus_v1_inner(');
    END IF;
    IF v_new_def = v_def THEN
      RAISE EXCEPTION 'could not clone system_apply_action for focus v1 guard';
    END IF;
    EXECUTE v_new_def;
  ELSIF to_regprocedure('system_apply_action_focus_v1_inner(jsonb,text,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'focus v1 wrapper exists without its inner implementation';
  END IF;
END;
$install_focus_v1_inner$;

REVOKE ALL ON FUNCTION system_apply_action_focus_v1_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION system_apply_action(
  p_action jsonb,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-api',
  p_source_ref text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_request_hash text DEFAULT NULL
)
RETURNS TABLE(replay boolean, event jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type text;
  v_payload jsonb;
  v_quest_id text;
  v_reason text;
  v_request_hash text;
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN
    RAISE EXCEPTION 'action body must be an object';
  END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;

  IF v_type <> 'quest.focus' THEN
    RETURN QUERY
      SELECT * FROM system_apply_action_focus_v1_inner(
        p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
      );
    RETURN;
  END IF;

  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);

  IF btrim(COALESCE(p_actor,''))='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(p_source,''))='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars';
  END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN
    RAISE EXCEPTION 'request_hash is invalid';
  END IF;

  v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
  v_reason := left(btrim(COALESCE(v_payload->>'reason','')),500);

  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true, to_jsonb(v_existing);
    RETURN;
  END IF;

  INSERT INTO system_events(
    event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload
  ) VALUES (
    gen_random_uuid(),'quest.focused',p_actor,p_source,p_source_ref,'derived',p_idempotency_key,v_request_hash,
    jsonb_build_object('quest_id',v_quest_id,'reason',v_reason)
  ) RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;
