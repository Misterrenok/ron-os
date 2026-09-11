-- Quest v2 additive lifecycle layer.
-- 002-004 remain the canonical v1/calibration implementation. This migration
-- preserves them and wraps only structured Quest v2 actions.

CREATE UNIQUE INDEX IF NOT EXISTS system_events_quest_terminal_v2_unique
  ON system_events ((payload->>'quest_id'))
  WHERE event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired');

CREATE UNIQUE INDEX IF NOT EXISTS system_events_quest_reveal_unique
  ON system_events ((payload->>'quest_id'))
  WHERE event_type = 'quest.revealed';

CREATE INDEX IF NOT EXISTS system_events_quest_progress_lookup
  ON system_events ((payload->>'quest_id'), (payload->>'objective_id'), seq)
  WHERE event_type = 'quest.progressed';

CREATE OR REPLACE FUNCTION system_validate_quest_v2_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
  v_created jsonb;
  v_objectives jsonb;
  v_obj jsonb;
  v_objective_id text;
  v_target bigint;
  v_value bigint;
  v_previous bigint;
  v_deadline timestamptz;
  v_visibility text;
  v_seen text[] := ARRAY[]::text[];
  v_evidence jsonb;
  v_status text;
  v_source text;
  v_ref text;
BEGIN
  IF jsonb_typeof(NEW.payload) <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;

  IF NEW.event_type IN ('quest.progressed','quest.revealed','quest.failed','quest.expired') THEN
    IF btrim(COALESCE(NEW.actor,'')) = '' OR length(NEW.actor) > 80 THEN RAISE EXCEPTION 'actor is required and must be <= 80 chars'; END IF;
    IF btrim(COALESCE(NEW.source,'')) = '' OR length(NEW.source) > 80 THEN RAISE EXCEPTION 'source is required and must be <= 80 chars'; END IF;
    IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref) > 500 THEN RAISE EXCEPTION 'source_ref must be <= 500 chars'; END IF;
    IF length(NEW.idempotency_key) < 8 OR length(NEW.idempotency_key) > 200 THEN RAISE EXCEPTION 'idempotency_key must be 8..200 chars'; END IF;
    IF btrim(COALESCE(NEW.request_hash,'')) = '' THEN RAISE EXCEPTION 'request_hash is required'; END IF;
  END IF;

  IF NEW.event_type = 'quest.created' AND COALESCE(NEW.payload->>'quest_version','') = '2' THEN
    v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
    PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:' || v_quest_id, 0));

    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'Quest v2 creation must be derived'; END IF;
    v_visibility := COALESCE(NEW.payload->>'visibility','VISIBLE');
    IF v_visibility NOT IN ('VISIBLE','HIDDEN') THEN RAISE EXCEPTION 'invalid Quest v2 visibility'; END IF;

    v_objectives := COALESCE(NEW.payload->'objectives','[]'::jsonb);
    IF jsonb_typeof(v_objectives) <> 'array' THEN RAISE EXCEPTION 'Quest v2 objectives must be an array'; END IF;
    IF jsonb_array_length(v_objectives) > 32 THEN RAISE EXCEPTION 'Quest v2 supports at most 32 objectives'; END IF;

    FOR v_obj IN SELECT value FROM jsonb_array_elements(v_objectives) AS x(value)
    LOOP
      IF jsonb_typeof(v_obj) <> 'object' THEN RAISE EXCEPTION 'Quest v2 objective must be an object'; END IF;
      v_objective_id := btrim(COALESCE(v_obj->>'objective_id',''));
      IF v_objective_id = '' OR length(v_objective_id) > 100 THEN RAISE EXCEPTION 'objective_id is required and must be <= 100 chars'; END IF;
      IF v_objective_id = ANY(v_seen) THEN RAISE EXCEPTION 'objective_id must be unique within a quest'; END IF;
      v_seen := array_append(v_seen, v_objective_id);
      IF btrim(COALESCE(v_obj->>'title','')) = '' OR length(v_obj->>'title') > 180 THEN RAISE EXCEPTION 'objective title is required and must be <= 180 chars'; END IF;
      IF COALESCE(v_obj->>'target','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'objective target must be a positive integer'; END IF;
      v_target := (v_obj->>'target')::bigint;
      IF v_target < 1 OR v_target > 1000000000 THEN RAISE EXCEPTION 'objective target must be between 1 and 1000000000'; END IF;
      IF btrim(COALESCE(v_obj->>'unit','')) = '' OR length(v_obj->>'unit') > 40 THEN RAISE EXCEPTION 'objective unit is required and must be <= 40 chars'; END IF;
      IF jsonb_typeof(v_obj->'required') <> 'boolean' THEN RAISE EXCEPTION 'objective required must be boolean'; END IF;
    END LOOP;

    IF NEW.payload ? 'deadline_at' AND jsonb_typeof(NEW.payload->'deadline_at') <> 'null' THEN
      BEGIN
        v_deadline := (NEW.payload->>'deadline_at')::timestamptz;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'deadline_at must be a valid timestamp or null';
      END;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type IN ('quest.completed','quest.cancelled','quest.progressed','quest.revealed','quest.failed','quest.expired') THEN
    v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
    IF v_quest_id = '' OR length(v_quest_id) > 100 THEN RAISE EXCEPTION 'quest_id is required and must be <= 100 chars'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:' || v_quest_id, 0));
    SELECT e.payload INTO v_created
      FROM system_events e
      WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id
      ORDER BY e.seq ASC LIMIT 1;
  END IF;

  IF NEW.event_type IN ('quest.progressed','quest.revealed','quest.failed','quest.expired') THEN
    IF v_created IS NULL THEN RAISE EXCEPTION 'quest does not exist'; END IF;
    IF COALESCE(v_created->>'quest_version','') <> '2' THEN RAISE EXCEPTION 'Quest v2 action requires a Quest v2 quest'; END IF;
  END IF;

  IF NEW.event_type IN ('quest.completed','quest.cancelled') AND COALESCE(v_created->>'quest_version','') = '2' THEN
    IF EXISTS (
      SELECT 1 FROM system_events e
      WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
        AND e.payload->>'quest_id'=v_quest_id
    ) THEN
      RAISE EXCEPTION 'quest is not active';
    END IF;

    IF NEW.event_type = 'quest.completed' THEN
      FOR v_obj IN
        SELECT value FROM jsonb_array_elements(COALESCE(v_created->'objectives','[]'::jsonb)) AS x(value)
        WHERE COALESCE((value->>'required')::boolean, true)
      LOOP
        v_objective_id := v_obj->>'objective_id';
        v_target := (v_obj->>'target')::bigint;
        SELECT COALESCE(max((e.payload->>'value')::bigint),0) INTO v_previous
          FROM system_events e
          WHERE e.event_type='quest.progressed'
            AND e.payload->>'quest_id'=v_quest_id
            AND e.payload->>'objective_id'=v_objective_id;
        IF v_previous < v_target THEN RAISE EXCEPTION 'required objectives are incomplete'; END IF;
      END LOOP;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type = 'quest.progressed' THEN
    IF EXISTS (
      SELECT 1 FROM system_events e
      WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
        AND e.payload->>'quest_id'=v_quest_id
    ) THEN RAISE EXCEPTION 'quest is not active'; END IF;

    v_objective_id := btrim(COALESCE(NEW.payload->>'objective_id',''));
    IF v_objective_id = '' OR length(v_objective_id) > 100 THEN RAISE EXCEPTION 'objective_id is required and must be <= 100 chars'; END IF;
    SELECT value INTO v_obj
      FROM jsonb_array_elements(COALESCE(v_created->'objectives','[]'::jsonb)) AS x(value)
      WHERE value->>'objective_id'=v_objective_id
      LIMIT 1;
    IF v_obj IS NULL THEN RAISE EXCEPTION 'objective does not exist'; END IF;

    IF COALESCE(NEW.payload->>'value','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'progress value must be a non-negative integer'; END IF;
    v_value := (NEW.payload->>'value')::bigint;
    v_target := (v_obj->>'target')::bigint;
    IF v_value > v_target THEN RAISE EXCEPTION 'progress cannot exceed objective target'; END IF;

    SELECT COALESCE(max((e.payload->>'value')::bigint),0) INTO v_previous
      FROM system_events e
      WHERE e.event_type='quest.progressed'
        AND e.payload->>'quest_id'=v_quest_id
        AND e.payload->>'objective_id'=v_objective_id;
    IF v_value <= v_previous THEN RAISE EXCEPTION 'progress must strictly increase'; END IF;

    IF NEW.claim_status NOT IN ('reported','verified') THEN RAISE EXCEPTION 'progress claim must be reported or verified'; END IF;
    v_evidence := NEW.payload->'evidence';
    IF jsonb_typeof(v_evidence) <> 'object' THEN RAISE EXCEPTION 'progress evidence is required'; END IF;
    v_status := COALESCE(v_evidence->>'status','');
    IF v_status <> NEW.claim_status THEN RAISE EXCEPTION 'progress evidence status must match claim_status'; END IF;
    v_source := btrim(COALESCE(v_evidence->>'source',''));
    IF v_source='' OR length(v_source)>80 THEN RAISE EXCEPTION 'progress evidence source is required'; END IF;
    v_ref := NULLIF(btrim(COALESCE(v_evidence->>'ref','')),'');
    IF v_ref IS NOT NULL AND length(v_ref)>500 THEN RAISE EXCEPTION 'progress evidence ref is too long'; END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type = 'quest.revealed' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.revealed must be derived'; END IF;
    IF COALESCE(v_created->>'visibility','VISIBLE') <> 'HIDDEN' THEN RAISE EXCEPTION 'quest is not hidden'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='quest.revealed' AND e.payload->>'quest_id'=v_quest_id) THEN
      RAISE EXCEPTION 'quest is already revealed';
    END IF;
    IF length(COALESCE(NEW.payload->>'reason','')) > 500 THEN RAISE EXCEPTION 'reveal reason must be <= 500 chars'; END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type = 'quest.failed' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.failed must be derived'; END IF;
    IF EXISTS (
      SELECT 1 FROM system_events e
      WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
        AND e.payload->>'quest_id'=v_quest_id
    ) THEN RAISE EXCEPTION 'quest is not active'; END IF;
    IF length(COALESCE(NEW.payload->>'reason','')) > 500 THEN RAISE EXCEPTION 'failure reason must be <= 500 chars'; END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type = 'quest.expired' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.expired must be derived'; END IF;
    IF EXISTS (
      SELECT 1 FROM system_events e
      WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
        AND e.payload->>'quest_id'=v_quest_id
    ) THEN RAISE EXCEPTION 'quest is not active'; END IF;
    IF jsonb_typeof(v_created->'deadline_at') = 'null' OR v_created->>'deadline_at' IS NULL THEN
      RAISE EXCEPTION 'quest has no deadline';
    END IF;
    BEGIN
      v_deadline := (v_created->>'deadline_at')::timestamptz;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'quest deadline is invalid';
    END;
    IF clock_timestamp() < v_deadline THEN RAISE EXCEPTION 'quest deadline has not passed'; END IF;
    IF length(COALESCE(NEW.payload->>'reason','')) > 500 THEN RAISE EXCEPTION 'expiry reason must be <= 500 chars'; END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN ('quest.progressed','quest.revealed','quest.failed','quest.expired'))
  EXECUTE FUNCTION system_validate_event_insert();

DROP TRIGGER IF EXISTS zz_system_events_quest_v2 ON system_events;
CREATE TRIGGER zz_system_events_quest_v2
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (
    NEW.event_type IN ('quest.completed','quest.cancelled','quest.progressed','quest.revealed','quest.failed','quest.expired')
    OR (NEW.event_type='quest.created' AND COALESCE(NEW.payload->>'quest_version','')='2')
  )
  EXECUTE FUNCTION system_validate_quest_v2_event();

DO $copy_v1$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;
  v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_v1(');
  IF v_new_def = v_def THEN
    v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_v1(');
  END IF;
  IF v_new_def = v_def THEN
    RAISE EXCEPTION 'could not clone system_apply_action for Quest v2 wrapper';
  END IF;
  EXECUTE v_new_def;
END;
$copy_v1$;

REVOKE ALL ON FUNCTION system_apply_action_v1(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
  v_request_hash text;
  v_event_type text;
  v_event_payload jsonb;
  v_claim_status text;
  v_quest_id text;
  v_title text;
  v_description text;
  v_class text;
  v_rank text;
  v_reward_xp bigint;
  v_reward_coins bigint;
  v_visibility text;
  v_deadline timestamptz;
  v_objectives_in jsonb;
  v_objectives_out jsonb := '[]'::jsonb;
  v_obj jsonb;
  v_objective_id text;
  v_objective_title text;
  v_target bigint;
  v_unit text;
  v_required boolean;
  v_seen text[] := ARRAY[]::text[];
  v_evidence jsonb;
  v_evidence_status text;
  v_evidence_source text;
  v_evidence_ref text;
  v_value bigint;
  v_reason text;
  v_is_structured_create boolean;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN RAISE EXCEPTION 'action body must be an object'; END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;
  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);

  v_is_structured_create := v_type='quest.create' AND (
    v_payload ? 'quest_version' OR v_payload ? 'objectives' OR v_payload ? 'deadline_at' OR v_payload ? 'visibility'
  );

  IF NOT v_is_structured_create AND v_type NOT IN ('quest.progress','quest.reveal','quest.fail','quest.expire') THEN
    RETURN QUERY
      SELECT * FROM system_apply_action_v1(p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash);
    RETURN;
  END IF;

  p_actor := btrim(COALESCE(p_actor,''));
  p_source := btrim(COALESCE(p_source,''));
  IF p_actor='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF p_source='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN RAISE EXCEPTION 'Idempotency-Key header (8..200 chars) is required'; END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;

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

  IF v_is_structured_create THEN
    IF v_payload ? 'quest_version' AND COALESCE(v_payload->>'quest_version','') <> '2' THEN
      RAISE EXCEPTION 'payload.quest_version must be 2 for Quest v2';
    END IF;
    v_event_type := 'quest.created';
    v_claim_status := 'derived';
    v_quest_id := btrim(COALESCE(v_payload->>'quest_id',gen_random_uuid()::text));
    IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is invalid'; END IF;
    v_title := btrim(COALESCE(v_payload->>'title',''));
    IF v_title='' OR length(v_title)>180 THEN RAISE EXCEPTION 'payload.title is required'; END IF;
    v_description := left(btrim(COALESCE(v_payload->>'description','')),2000);
    v_class := COALESCE(v_payload->>'class','SIDE');
    IF v_class NOT IN ('DAILY','SIDE','MAIN','RECOVERY','HIDDEN') THEN RAISE EXCEPTION 'payload.class is invalid'; END IF;
    v_rank := COALESCE(v_payload->>'rank','E');
    IF v_rank NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'payload.rank is invalid'; END IF;

    IF v_payload ? 'reward_xp' AND jsonb_typeof(v_payload->'reward_xp') <> 'null' THEN
      IF COALESCE(v_payload->>'reward_xp','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.reward_xp must be a non-negative integer or null'; END IF;
      v_reward_xp := (v_payload->>'reward_xp')::bigint;
    ELSE v_reward_xp := NULL; END IF;
    IF v_payload ? 'reward_coins' AND jsonb_typeof(v_payload->'reward_coins') <> 'null' THEN
      IF COALESCE(v_payload->>'reward_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.reward_coins must be a non-negative integer or null'; END IF;
      v_reward_coins := (v_payload->>'reward_coins')::bigint;
    ELSE v_reward_coins := NULL; END IF;

    v_visibility := COALESCE(v_payload->>'visibility', CASE WHEN v_class='HIDDEN' THEN 'HIDDEN' ELSE 'VISIBLE' END);
    IF v_visibility NOT IN ('VISIBLE','HIDDEN') THEN RAISE EXCEPTION 'payload.visibility is invalid'; END IF;

    IF v_payload ? 'deadline_at' AND jsonb_typeof(v_payload->'deadline_at') <> 'null' THEN
      BEGIN
        v_deadline := (v_payload->>'deadline_at')::timestamptz;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'payload.deadline_at must be a valid timestamp or null';
      END;
    ELSE v_deadline := NULL; END IF;

    v_objectives_in := COALESCE(v_payload->'objectives','[]'::jsonb);
    IF jsonb_typeof(v_objectives_in) <> 'array' THEN RAISE EXCEPTION 'payload.objectives must be an array'; END IF;
    IF jsonb_array_length(v_objectives_in) > 32 THEN RAISE EXCEPTION 'payload.objectives supports at most 32 objectives'; END IF;

    FOR v_obj IN SELECT value FROM jsonb_array_elements(v_objectives_in) AS x(value)
    LOOP
      IF jsonb_typeof(v_obj) <> 'object' THEN RAISE EXCEPTION 'objective must be an object'; END IF;
      v_objective_id := btrim(COALESCE(v_obj->>'objective_id',gen_random_uuid()::text));
      IF v_objective_id='' OR length(v_objective_id)>100 THEN RAISE EXCEPTION 'objective_id is invalid'; END IF;
      IF v_objective_id = ANY(v_seen) THEN RAISE EXCEPTION 'objective_id must be unique within a quest'; END IF;
      v_seen := array_append(v_seen,v_objective_id);
      v_objective_title := btrim(COALESCE(v_obj->>'title',''));
      IF v_objective_title='' OR length(v_objective_title)>180 THEN RAISE EXCEPTION 'objective title is required'; END IF;
      IF COALESCE(v_obj->>'target','1') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'objective target must be a positive integer'; END IF;
      v_target := COALESCE((v_obj->>'target')::bigint,1);
      IF v_target<1 OR v_target>1000000000 THEN RAISE EXCEPTION 'objective target is invalid'; END IF;
      v_unit := btrim(COALESCE(v_obj->>'unit','count'));
      IF v_unit='' OR length(v_unit)>40 THEN RAISE EXCEPTION 'objective unit is invalid'; END IF;
      IF v_obj ? 'required' THEN
        IF jsonb_typeof(v_obj->'required') <> 'boolean' THEN RAISE EXCEPTION 'objective required must be boolean'; END IF;
        v_required := (v_obj->>'required')::boolean;
      ELSE v_required := true; END IF;
      v_objectives_out := v_objectives_out || jsonb_build_array(
        jsonb_build_object('objective_id',v_objective_id,'title',v_objective_title,'target',v_target,'unit',v_unit,'required',v_required)
      );
    END LOOP;

    v_event_payload := jsonb_build_object(
      'quest_id',v_quest_id,'title',v_title,'description',v_description,'class',v_class,'rank',v_rank,
      'reward_xp',v_reward_xp,'reward_coins',v_reward_coins,
      'quest_version',2,'objectives',v_objectives_out,'deadline_at',v_deadline,'visibility',v_visibility
    );

  ELSIF v_type = 'quest.progress' THEN
    v_event_type := 'quest.progressed';
    v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
    v_objective_id := btrim(COALESCE(v_payload->>'objective_id',''));
    IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
    IF v_objective_id='' OR length(v_objective_id)>100 THEN RAISE EXCEPTION 'payload.objective_id is required'; END IF;
    IF COALESCE(v_payload->>'value','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.value must be a non-negative integer'; END IF;
    v_value := (v_payload->>'value')::bigint;
    IF v_value>1000000000 THEN RAISE EXCEPTION 'payload.value is too large'; END IF;
    IF v_payload ? 'evidence' AND jsonb_typeof(v_payload->'evidence') <> 'object' THEN RAISE EXCEPTION 'evidence must be an object'; END IF;
    v_evidence := COALESCE(v_payload->'evidence','{}'::jsonb);
    v_evidence_status := COALESCE(v_evidence->>'status','reported');
    IF v_evidence_status NOT IN ('reported','verified') THEN RAISE EXCEPTION 'evidence.status is invalid'; END IF;
    v_evidence_source := btrim(COALESCE(v_evidence->>'source','ron'));
    IF v_evidence_source='' OR length(v_evidence_source)>80 THEN RAISE EXCEPTION 'evidence.source is invalid'; END IF;
    v_evidence_ref := NULLIF(btrim(COALESCE(v_evidence->>'ref','')),'');
    IF v_evidence_ref IS NOT NULL AND length(v_evidence_ref)>500 THEN RAISE EXCEPTION 'evidence.ref is too long'; END IF;
    v_claim_status := v_evidence_status;
    v_event_payload := jsonb_build_object(
      'quest_id',v_quest_id,'objective_id',v_objective_id,'value',v_value,
      'evidence',jsonb_build_object('status',v_evidence_status,'source',v_evidence_source,'ref',v_evidence_ref)
    );

  ELSIF v_type = 'quest.reveal' THEN
    v_event_type := 'quest.revealed';
    v_claim_status := 'derived';
    v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
    IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
    v_reason := left(btrim(COALESCE(v_payload->>'reason','')),500);
    v_event_payload := jsonb_build_object('quest_id',v_quest_id,'reason',v_reason);

  ELSIF v_type = 'quest.fail' THEN
    v_event_type := 'quest.failed';
    v_claim_status := 'derived';
    v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
    IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
    v_reason := left(btrim(COALESCE(v_payload->>'reason','')),500);
    v_event_payload := jsonb_build_object('quest_id',v_quest_id,'reason',v_reason);

  ELSIF v_type = 'quest.expire' THEN
    v_event_type := 'quest.expired';
    v_claim_status := 'derived';
    v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
    IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
    v_reason := left(btrim(COALESCE(v_payload->>'reason','')),500);
    v_event_payload := jsonb_build_object('quest_id',v_quest_id,'reason',v_reason);

  ELSE
    RAISE EXCEPTION 'unsupported Quest v2 action type: %', v_type;
  END IF;

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(gen_random_uuid(),v_event_type,p_actor,p_source,p_source_ref,v_claim_status,p_idempotency_key,v_request_hash,v_event_payload)
  RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;
