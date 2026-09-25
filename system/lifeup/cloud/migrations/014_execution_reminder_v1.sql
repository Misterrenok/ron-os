-- Execution Reminder v1.
-- Future quest reminders are first-class System ledger events. The reminder engine
-- only emits notification.pushed when the scheduled time arrives and the Quest is
-- still ACTIVE. No deadline, reward, penalty or quest lifecycle mutation is implied.

CREATE UNIQUE INDEX IF NOT EXISTS system_events_execution_reminder_schedule_unique
  ON system_events ((payload->>'schedule_id'))
  WHERE event_type='reminder.scheduled';

-- Preserve every prior dedicated-validator exception and add reminder.scheduled.
DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN ('quest.progressed','quest.revealed','quest.failed','quest.expired','quest.focused','challenge.declared','reminder.scheduled'))
  EXECUTE FUNCTION system_validate_event_insert();

CREATE OR REPLACE FUNCTION system_validate_execution_reminder_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_schedule_id text;
  v_quest_id text;
  v_remind_at timestamptz;
  v_created jsonb;
BEGIN
  IF NEW.event_type <> 'reminder.scheduled' THEN RETURN NEW; END IF;
  IF jsonb_typeof(NEW.payload) <> 'object' THEN RAISE EXCEPTION 'Execution reminder payload must be an object'; END IF;
  IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'reminder.scheduled must be derived'; END IF;
  IF btrim(COALESCE(NEW.actor,''))='' OR length(NEW.actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(NEW.source,''))='' OR length(NEW.source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF NEW.idempotency_key IS NULL OR length(NEW.idempotency_key)<8 OR length(NEW.idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency_key must be 8..200 chars';
  END IF;
  IF btrim(COALESCE(NEW.request_hash,''))='' OR length(NEW.request_hash)>128 THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;
  IF COALESCE(NEW.payload->>'policy_ref','') <> 'system-execution-reminder:v1' THEN
    RAISE EXCEPTION 'Execution reminder policy_ref is invalid';
  END IF;

  v_schedule_id := btrim(COALESCE(NEW.payload->>'schedule_id',''));
  IF v_schedule_id='' OR length(v_schedule_id)>100 THEN RAISE EXCEPTION 'Execution reminder schedule_id is invalid'; END IF;
  v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'Execution reminder quest_id is invalid'; END IF;

  SELECT e.payload INTO v_created FROM system_events e
  WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id
  ORDER BY e.seq ASC LIMIT 1;
  IF v_created IS NULL OR COALESCE(v_created->>'quest_version','') <> '2' THEN
    RAISE EXCEPTION 'Execution reminder requires an existing Quest v2';
  END IF;
  IF EXISTS (
    SELECT 1 FROM system_events e
    WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
      AND e.payload->>'quest_id'=v_quest_id
  ) THEN RAISE EXCEPTION 'Execution reminder requires an active Quest'; END IF;

  BEGIN
    v_remind_at := (NEW.payload->>'remind_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Execution reminder remind_at must be a valid timestamp';
  END;
  IF v_remind_at <= clock_timestamp() THEN RAISE EXCEPTION 'Execution reminder remind_at must be in the future'; END IF;
  IF btrim(COALESCE(NEW.payload->>'title',''))='' OR length(NEW.payload->>'title')>180 THEN
    RAISE EXCEPTION 'Execution reminder title is invalid';
  END IF;
  IF length(COALESCE(NEW.payload->>'body',''))>1200 THEN RAISE EXCEPTION 'Execution reminder body is too long'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_system_events_execution_reminder_v1 ON system_events;
CREATE TRIGGER zzz_system_events_execution_reminder_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='reminder.scheduled')
  EXECUTE FUNCTION system_validate_execution_reminder_v1();

CREATE OR REPLACE FUNCTION system_schedule_execution_reminder_v1(
  p_action jsonb,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-api',
  p_source_ref text DEFAULT 'system-execution-reminder:v1',
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
  v_schedule_id text;
  v_quest_id text;
  v_remind_at timestamptz;
  v_title text;
  v_body text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action)<>'object' OR p_action->>'type'<>'reminder.schedule' THEN
    RAISE EXCEPTION 'system_schedule_execution_reminder_v1 requires reminder.schedule';
  END IF;
  IF jsonb_typeof(p_action->'payload')<>'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := p_action->'payload';

  IF btrim(COALESCE(p_actor,''))='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(p_source,''))='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars';
  END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;
  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash<>v_request_hash OR v_existing.event_type<>'reminder.scheduled' THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true, to_jsonb(v_existing);
    RETURN;
  END IF;

  v_schedule_id := btrim(COALESCE(v_payload->>'schedule_id',''));
  v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
  BEGIN
    v_remind_at := (v_payload->>'remind_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Execution reminder remind_at must be a valid timestamp';
  END;
  v_title := btrim(COALESCE(v_payload->>'title',''));
  v_body := left(COALESCE(v_payload->>'body',''),1200);

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(
    gen_random_uuid(),'reminder.scheduled',p_actor,p_source,COALESCE(p_source_ref,'system-execution-reminder:v1'),
    'derived',p_idempotency_key,v_request_hash,
    jsonb_build_object(
      'policy_ref','system-execution-reminder:v1',
      'schedule_id',v_schedule_id,
      'quest_id',v_quest_id,
      'remind_at',v_remind_at,
      'title',v_title,
      'body',v_body
    )
  ) RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;

REVOKE ALL ON FUNCTION system_schedule_execution_reminder_v1(jsonb,text,text,text,text,text) FROM PUBLIC;
