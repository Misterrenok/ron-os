CREATE UNIQUE INDEX IF NOT EXISTS system_events_quest_id_unique
  ON system_events ((payload->>'quest_id'))
  WHERE event_type = 'quest.created';

CREATE UNIQUE INDEX IF NOT EXISTS system_events_quest_terminal_unique
  ON system_events ((payload->>'quest_id'))
  WHERE event_type IN ('quest.completed', 'quest.cancelled');

CREATE OR REPLACE FUNCTION system_validate_event_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
  v_basis system_events%ROWTYPE;
BEGIN
  IF NEW.event_type NOT IN ('quest.created','quest.completed','quest.cancelled','progression.awarded') THEN
    RAISE EXCEPTION 'unsupported event type: %', NEW.event_type;
  END IF;
  IF btrim(COALESCE(NEW.actor,'')) = '' OR length(NEW.actor) > 80 THEN RAISE EXCEPTION 'actor is required and must be <= 80 chars'; END IF;
  IF btrim(COALESCE(NEW.source,'')) = '' OR length(NEW.source) > 80 THEN RAISE EXCEPTION 'source is required and must be <= 80 chars'; END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref) > 500 THEN RAISE EXCEPTION 'source_ref must be <= 500 chars'; END IF;
  IF length(NEW.idempotency_key) < 8 OR length(NEW.idempotency_key) > 200 THEN RAISE EXCEPTION 'idempotency_key must be 8..200 chars'; END IF;
  IF btrim(COALESCE(NEW.request_hash,'')) = '' THEN RAISE EXCEPTION 'request_hash is required'; END IF;
  IF jsonb_typeof(NEW.payload) <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;

  IF NEW.event_type = 'quest.created' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.created must be derived'; END IF;
    v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
    IF v_quest_id = '' OR length(v_quest_id) > 100 THEN RAISE EXCEPTION 'quest_id is required and must be <= 100 chars'; END IF;
    IF btrim(COALESCE(NEW.payload->>'title','')) = '' OR length(NEW.payload->>'title') > 180 THEN RAISE EXCEPTION 'title is required and must be <= 180 chars'; END IF;
    IF length(COALESCE(NEW.payload->>'description','')) > 2000 THEN RAISE EXCEPTION 'description must be <= 2000 chars'; END IF;
    IF COALESCE(NEW.payload->>'class','') NOT IN ('DAILY','SIDE','MAIN','RECOVERY','HIDDEN') THEN RAISE EXCEPTION 'invalid quest class'; END IF;
    IF COALESCE(NEW.payload->>'rank','') NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'invalid quest rank'; END IF;
    IF NEW.payload ? 'reward_xp' AND jsonb_typeof(NEW.payload->'reward_xp') <> 'null' AND COALESCE(NEW.payload->>'reward_xp','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'reward_xp must be a non-negative integer or null'; END IF;
    IF NEW.payload ? 'reward_coins' AND jsonb_typeof(NEW.payload->'reward_coins') <> 'null' AND COALESCE(NEW.payload->>'reward_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'reward_coins must be a non-negative integer or null'; END IF;

  ELSIF NEW.event_type IN ('quest.completed','quest.cancelled') THEN
    v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
    IF v_quest_id = '' OR length(v_quest_id) > 100 THEN RAISE EXCEPTION 'quest_id is required and must be <= 100 chars'; END IF;
    IF NOT EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id) THEN RAISE EXCEPTION 'quest does not exist'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type IN ('quest.completed','quest.cancelled') AND e.payload->>'quest_id'=v_quest_id) THEN RAISE EXCEPTION 'quest is not active'; END IF;
    IF NEW.event_type='quest.completed' THEN
      IF NEW.claim_status NOT IN ('reported','verified') THEN RAISE EXCEPTION 'quest.completed claim must be reported or verified'; END IF;
      IF jsonb_typeof(NEW.payload->'evidence') <> 'object' THEN RAISE EXCEPTION 'completion evidence is required'; END IF;
      IF COALESCE(NEW.payload->'evidence'->>'status','') <> NEW.claim_status THEN RAISE EXCEPTION 'completion evidence status must match claim_status'; END IF;
      IF btrim(COALESCE(NEW.payload->'evidence'->>'source',''))='' OR length(NEW.payload->'evidence'->>'source')>80 THEN RAISE EXCEPTION 'completion evidence source is required'; END IF;
      IF NEW.payload->'evidence'->>'ref' IS NOT NULL AND length(NEW.payload->'evidence'->>'ref')>500 THEN RAISE EXCEPTION 'completion evidence ref is too long'; END IF;
    ELSE
      IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.cancelled must be derived'; END IF;
      IF length(COALESCE(NEW.payload->>'reason','')) > 500 THEN RAISE EXCEPTION 'cancel reason must be <= 500 chars'; END IF;
    END IF;

  ELSIF NEW.event_type='progression.awarded' THEN
    IF NEW.claim_status <> 'verified' THEN RAISE EXCEPTION 'progression.awarded must be verified'; END IF;
    IF jsonb_typeof(NEW.payload->'evidence') <> 'object' OR COALESCE(NEW.payload->'evidence'->>'status','') <> 'verified' THEN RAISE EXCEPTION 'verified evidence is required'; END IF;
    IF btrim(COALESCE(NEW.payload->'evidence'->>'source',''))='' OR length(NEW.payload->'evidence'->>'source')>80 THEN RAISE EXCEPTION 'progression evidence source is required'; END IF;
    IF NEW.payload->'evidence'->>'ref' IS NOT NULL AND length(NEW.payload->'evidence'->>'ref')>500 THEN RAISE EXCEPTION 'progression evidence ref is too long'; END IF;
    IF COALESCE(NEW.payload->>'xp','') !~ '^[0-9]+$' OR COALESCE(NEW.payload->>'coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'xp and coins must be non-negative integers'; END IF;
    IF (NEW.payload->>'xp')::numeric = 0 AND (NEW.payload->>'coins')::numeric = 0 THEN RAISE EXCEPTION 'progression.award requires xp or coins'; END IF;
    IF btrim(COALESCE(NEW.payload->>'basis_event_id',''))='' OR length(NEW.payload->>'basis_event_id')>100 THEN RAISE EXCEPTION 'basis_event_id is required'; END IF;
    SELECT * INTO v_basis FROM system_events e WHERE e.event_id::text = NEW.payload->>'basis_event_id';
    IF NOT FOUND THEN RAISE EXCEPTION 'basis_event_id does not exist'; END IF;
    IF v_basis.event_type <> 'quest.completed' THEN RAISE EXCEPTION 'progression basis must be a quest.completed event'; END IF;
    IF v_basis.claim_status <> 'verified' THEN RAISE EXCEPTION 'progression basis must be verified'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='progression.awarded' AND e.payload->>'basis_event_id'=v_basis.event_id::text) THEN RAISE EXCEPTION 'progression already awarded for basis event'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION system_events_append_only_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'system_events is append-only';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='system_events'::regclass AND tgname='system_events_validate_insert') THEN
    CREATE TRIGGER system_events_validate_insert
      BEFORE INSERT ON system_events
      FOR EACH ROW EXECUTE FUNCTION system_validate_event_insert();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='system_events'::regclass AND tgname='system_events_append_only') THEN
    CREATE TRIGGER system_events_append_only
      BEFORE UPDATE OR DELETE ON system_events
      FOR EACH ROW EXECUTE FUNCTION system_events_append_only_guard();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION system_apply_action(
  p_action jsonb,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-api',
  p_source_ref text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE(replay boolean, event jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type text;
  v_payload jsonb;
  v_event_type text;
  v_event_payload jsonb;
  v_claim_status text;
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
  v_request_hash text;
  v_quest_id text;
  v_title text;
  v_description text;
  v_class text;
  v_rank text;
  v_reward_xp bigint;
  v_reward_coins bigint;
  v_evidence jsonb;
  v_evidence_status text;
  v_evidence_source text;
  v_evidence_ref text;
  v_reason text;
  v_xp bigint;
  v_coins bigint;
  v_basis_event_id text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN RAISE EXCEPTION 'action body must be an object'; END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;
  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);
  p_actor := btrim(COALESCE(p_actor,''));
  p_source := btrim(COALESCE(p_source,''));
  IF p_actor='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF p_source='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN RAISE EXCEPTION 'Idempotency-Key header (8..200 chars) is required'; END IF;

  v_request_hash := md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true, to_jsonb(v_existing);
    RETURN;
  END IF;

  CASE v_type
    WHEN 'quest.create' THEN
      v_event_type := 'quest.created';
      v_quest_id := btrim(COALESCE(v_payload->>'quest_id', gen_random_uuid()::text));
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
      END IF;
      IF v_payload ? 'reward_coins' AND jsonb_typeof(v_payload->'reward_coins') <> 'null' THEN
        IF COALESCE(v_payload->>'reward_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.reward_coins must be a non-negative integer or null'; END IF;
        v_reward_coins := (v_payload->>'reward_coins')::bigint;
      END IF;
      v_event_payload := jsonb_build_object('quest_id',v_quest_id,'title',v_title,'description',v_description,'class',v_class,'rank',v_rank,'reward_xp',v_reward_xp,'reward_coins',v_reward_coins);
      v_claim_status := 'derived';

    WHEN 'quest.complete' THEN
      v_event_type := 'quest.completed';
      v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
      IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
      IF v_payload ? 'evidence' AND jsonb_typeof(v_payload->'evidence') <> 'object' THEN RAISE EXCEPTION 'evidence must be an object'; END IF;
      v_evidence := COALESCE(v_payload->'evidence','{}'::jsonb);
      v_evidence_status := COALESCE(v_evidence->>'status','reported');
      IF v_evidence_status NOT IN ('reported','verified') THEN RAISE EXCEPTION 'evidence.status is invalid'; END IF;
      v_evidence_source := btrim(COALESCE(v_evidence->>'source','ron'));
      IF v_evidence_source='' OR length(v_evidence_source)>80 THEN RAISE EXCEPTION 'evidence.source is invalid'; END IF;
      v_evidence_ref := NULLIF(btrim(COALESCE(v_evidence->>'ref','')),'');
      IF v_evidence_ref IS NOT NULL AND length(v_evidence_ref)>500 THEN RAISE EXCEPTION 'evidence.ref is too long'; END IF;
      v_event_payload := jsonb_build_object('quest_id',v_quest_id,'evidence',jsonb_build_object('status',v_evidence_status,'source',v_evidence_source,'ref',v_evidence_ref));
      v_claim_status := v_evidence_status;

    WHEN 'quest.cancel' THEN
      v_event_type := 'quest.cancelled';
      v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
      IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
      v_reason := left(btrim(COALESCE(v_payload->>'reason','')),500);
      v_event_payload := jsonb_build_object('quest_id',v_quest_id,'reason',v_reason);
      v_claim_status := 'derived';

    WHEN 'progression.award' THEN
      v_event_type := 'progression.awarded';
      IF NOT (v_payload ? 'evidence') OR jsonb_typeof(v_payload->'evidence') <> 'object' THEN RAISE EXCEPTION 'verified evidence is required'; END IF;
      v_evidence := v_payload->'evidence';
      v_evidence_status := COALESCE(v_evidence->>'status','reported');
      IF v_evidence_status <> 'verified' THEN RAISE EXCEPTION 'verified evidence is required'; END IF;
      v_evidence_source := btrim(COALESCE(v_evidence->>'source','ron'));
      IF v_evidence_source='' OR length(v_evidence_source)>80 THEN RAISE EXCEPTION 'evidence.source is invalid'; END IF;
      v_evidence_ref := NULLIF(btrim(COALESCE(v_evidence->>'ref','')),'');
      IF v_evidence_ref IS NOT NULL AND length(v_evidence_ref)>500 THEN RAISE EXCEPTION 'evidence.ref is too long'; END IF;
      IF COALESCE(v_payload->>'xp','0') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.xp must be a non-negative integer'; END IF;
      IF COALESCE(v_payload->>'coins','0') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.coins must be a non-negative integer'; END IF;
      v_xp := COALESCE((v_payload->>'xp')::bigint,0);
      v_coins := COALESCE((v_payload->>'coins')::bigint,0);
      IF v_xp=0 AND v_coins=0 THEN RAISE EXCEPTION 'progression.award requires xp or coins'; END IF;
      v_basis_event_id := btrim(COALESCE(v_payload->>'basis_event_id',''));
      IF v_basis_event_id='' OR length(v_basis_event_id)>100 THEN RAISE EXCEPTION 'payload.basis_event_id is required'; END IF;
      v_event_payload := jsonb_build_object('xp',v_xp,'coins',v_coins,'basis_event_id',v_basis_event_id,'evidence',jsonb_build_object('status','verified','source',v_evidence_source,'ref',v_evidence_ref));
      v_claim_status := 'verified';

    ELSE
      RAISE EXCEPTION 'unsupported action type: %', v_type;
  END CASE;

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(gen_random_uuid(),v_event_type,p_actor,p_source,p_source_ref,v_claim_status,p_idempotency_key,v_request_hash,v_event_payload)
  RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;
