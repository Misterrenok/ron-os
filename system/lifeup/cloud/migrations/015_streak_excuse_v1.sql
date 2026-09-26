-- Streak Excuse v1.
-- Protected interruptions can neutralize streak liability for a local execution day.
-- This never restores a forfeited Challenge reward or rewrites quest lifecycle/history.

CREATE UNIQUE INDEX IF NOT EXISTS system_events_streak_excuse_date_unique
  ON system_events ((payload->>'local_date'))
  WHERE event_type='streak.excused';

DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN ('quest.progressed','quest.revealed','quest.failed','quest.expired','quest.focused','challenge.declared','reminder.scheduled','streak.excused'))
  EXECUTE FUNCTION system_validate_event_insert();

CREATE OR REPLACE FUNCTION system_validate_streak_excuse_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date date;
  v_reason_code text;
BEGIN
  IF NEW.event_type <> 'streak.excused' THEN RETURN NEW; END IF;
  IF jsonb_typeof(NEW.payload) <> 'object' THEN RAISE EXCEPTION 'Streak excuse payload must be an object'; END IF;
  IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'streak.excused must be derived'; END IF;
  IF COALESCE(NEW.payload->>'policy_ref','') <> 'system-execution-streak:v1' THEN
    RAISE EXCEPTION 'Streak excuse policy_ref is invalid';
  END IF;
  BEGIN
    v_date := (NEW.payload->>'local_date')::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Streak excuse local_date must be YYYY-MM-DD';
  END;
  IF v_date < DATE '2026-09-26' THEN RAISE EXCEPTION 'Streak excuse predates policy activation'; END IF;
  v_reason_code := COALESCE(NEW.payload->>'reason_code','');
  IF v_reason_code NOT IN ('ILLNESS','SAFETY','EXTERNAL_DISRUPTION','SYSTEM_FAILURE','SCHEDULE_INVALIDATED') THEN
    RAISE EXCEPTION 'Streak excuse reason_code is invalid';
  END IF;
  IF length(btrim(COALESCE(NEW.payload->>'reason',''))) < 3 OR length(NEW.payload->>'reason') > 500 THEN
    RAISE EXCEPTION 'Streak excuse reason must be 3..500 chars';
  END IF;
  IF btrim(COALESCE(NEW.actor,''))='' OR length(NEW.actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(NEW.source,''))='' OR length(NEW.source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF NEW.idempotency_key IS NULL OR length(NEW.idempotency_key)<8 OR length(NEW.idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency_key must be 8..200 chars';
  END IF;
  IF btrim(COALESCE(NEW.request_hash,''))='' OR length(NEW.request_hash)>128 THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_system_events_streak_excuse_v1 ON system_events;
CREATE TRIGGER zzz_system_events_streak_excuse_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='streak.excused')
  EXECUTE FUNCTION system_validate_streak_excuse_v1();

CREATE OR REPLACE FUNCTION system_excuse_execution_streak_v1(
  p_action jsonb,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-api',
  p_source_ref text DEFAULT 'system-execution-streak:v1',
  p_idempotency_key text DEFAULT NULL,
  p_request_hash text DEFAULT NULL
)
RETURNS TABLE(replay boolean, event jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payload jsonb;
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
  v_request_hash text;
  v_local_date date;
  v_reason_code text;
  v_reason text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action)<>'object' OR p_action->>'type'<>'streak.excuse' THEN
    RAISE EXCEPTION 'system_excuse_execution_streak_v1 requires streak.excuse';
  END IF;
  IF jsonb_typeof(p_action->'payload')<>'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := p_action->'payload';
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars';
  END IF;
  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash<>v_request_hash OR v_existing.event_type<>'streak.excused' THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true, to_jsonb(v_existing);
    RETURN;
  END IF;

  v_local_date := (v_payload->>'local_date')::date;
  v_reason_code := btrim(COALESCE(v_payload->>'reason_code',''));
  v_reason := btrim(COALESCE(v_payload->>'reason',''));

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(
    gen_random_uuid(),'streak.excused',p_actor,p_source,COALESCE(p_source_ref,'system-execution-streak:v1'),
    'derived',p_idempotency_key,v_request_hash,
    jsonb_build_object(
      'policy_ref','system-execution-streak:v1',
      'local_date',to_char(v_local_date,'YYYY-MM-DD'),
      'reason_code',v_reason_code,
      'reason',v_reason
    )
  ) RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;

REVOKE ALL ON FUNCTION system_excuse_execution_streak_v1(jsonb,text,text,text,text,text) FROM PUBLIC;
