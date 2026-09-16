-- Challenge Contract v1.
-- A Challenge is an optional Quest v2 pressure contract. Creation persists the exact
-- recovery contract and Quest atomically; a missed Challenge expires and creates its
-- predeclared unscored RECOVERY quest atomically. No focus, reward multiplier, Boss,
-- Arc, Rank or external-source mutation is introduced here.

CREATE UNIQUE INDEX IF NOT EXISTS system_events_challenge_contract_id_unique
  ON system_events ((payload->>'contract_id'))
  WHERE event_type='challenge.declared';

CREATE UNIQUE INDEX IF NOT EXISTS system_events_challenge_quest_id_unique
  ON system_events ((payload->>'quest_id'))
  WHERE event_type='challenge.declared';

-- Route Challenge declarations around the legacy generic validator; a dedicated
-- validator below owns the exact contract shape. Preserve every prior exception.
DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN ('quest.progressed','quest.revealed','quest.failed','quest.expired','quest.focused','challenge.declared'))
  EXECUTE FUNCTION system_validate_event_insert();

CREATE OR REPLACE FUNCTION system_validate_challenge_contract_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contract_id text;
  v_quest_id text;
  v_deadline timestamptz;
  v_target bigint;
  v_expected_recovery_quest text;
  v_expected_recovery_objective text;
BEGIN
  IF NEW.event_type <> 'challenge.declared' THEN RETURN NEW; END IF;

  IF jsonb_typeof(NEW.payload) <> 'object' THEN RAISE EXCEPTION 'Challenge payload must be an object'; END IF;
  IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'challenge.declared must be derived'; END IF;
  IF btrim(COALESCE(NEW.actor,''))='' OR length(NEW.actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(NEW.source,''))='' OR length(NEW.source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF NEW.idempotency_key IS NULL OR length(NEW.idempotency_key)<8 OR length(NEW.idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency_key must be 8..200 chars';
  END IF;
  IF btrim(COALESCE(NEW.request_hash,''))='' OR length(NEW.request_hash)>128 THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;
  IF COALESCE(NEW.payload->>'policy_ref','') <> 'system-challenge-contract:v1' THEN
    RAISE EXCEPTION 'Challenge policy_ref is invalid';
  END IF;

  BEGIN
    v_contract_id := ((NEW.payload->>'contract_id')::uuid)::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge contract_id must be a UUID';
  END;
  IF NEW.payload->>'contract_id' <> v_contract_id THEN RAISE EXCEPTION 'Challenge contract_id must be canonical lowercase UUID'; END IF;

  v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'Challenge quest_id is invalid'; END IF;
  IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id) THEN
    RAISE EXCEPTION 'Challenge v1 cannot retrofit an already-created quest';
  END IF;

  BEGIN
    v_deadline := (NEW.payload->>'deadline_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge deadline_at must be a valid timestamp';
  END;
  IF v_deadline <= clock_timestamp() THEN RAISE EXCEPTION 'Challenge deadline_at must be in the future'; END IF;

  v_expected_recovery_quest := 'challenge-recovery:' || v_contract_id;
  v_expected_recovery_objective := 'challenge-recovery-objective:' || v_contract_id;
  IF COALESCE(NEW.payload->>'recovery_quest_id','') <> v_expected_recovery_quest THEN
    RAISE EXCEPTION 'Challenge recovery_quest_id is invalid';
  END IF;
  IF COALESCE(NEW.payload->>'recovery_objective_id','') <> v_expected_recovery_objective THEN
    RAISE EXCEPTION 'Challenge recovery_objective_id is invalid';
  END IF;
  IF btrim(COALESCE(NEW.payload->>'recovery_title',''))='' OR length(NEW.payload->>'recovery_title')>180 THEN
    RAISE EXCEPTION 'Challenge recovery_title is invalid';
  END IF;
  IF btrim(COALESCE(NEW.payload->>'recovery_objective',''))='' OR length(NEW.payload->>'recovery_objective')>180 THEN
    RAISE EXCEPTION 'Challenge recovery_objective is invalid';
  END IF;
  IF COALESCE(NEW.payload->>'recovery_target','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Challenge recovery_target is invalid'; END IF;
  v_target := (NEW.payload->>'recovery_target')::bigint;
  IF v_target<1 OR v_target>1000000000 THEN RAISE EXCEPTION 'Challenge recovery_target is invalid'; END IF;
  IF btrim(COALESCE(NEW.payload->>'recovery_unit',''))='' OR length(NEW.payload->>'recovery_unit')>40 THEN
    RAISE EXCEPTION 'Challenge recovery_unit is invalid';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzy_system_events_challenge_contract_v1 ON system_events;
CREATE TRIGGER zzy_system_events_challenge_contract_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='challenge.declared')
  EXECUTE FUNCTION system_validate_challenge_contract_v1();

CREATE OR REPLACE FUNCTION system_apply_challenge_v1(
  p_action jsonb,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-api',
  p_source_ref text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_request_hash text DEFAULT NULL
)
RETURNS TABLE(replay boolean, events jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payload jsonb;
  v_quest jsonb;
  v_contract jsonb;
  v_existing system_events%ROWTYPE;
  v_declared system_events%ROWTYPE;
  v_request_hash text;
  v_contract_id text;
  v_quest_id text;
  v_deadline timestamptz;
  v_recovery_title text;
  v_recovery_objective text;
  v_recovery_target bigint;
  v_recovery_unit text;
  v_recovery_quest_id text;
  v_recovery_objective_id text;
  v_quest_key text;
  v_quest_event jsonb;
  v_scored boolean;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' OR p_action->>'type' <> 'challenge.create' THEN
    RAISE EXCEPTION 'system_apply_challenge_v1 requires challenge.create';
  END IF;
  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);
  IF jsonb_typeof(v_payload->'quest') <> 'object' THEN RAISE EXCEPTION 'payload.quest must be an object'; END IF;
  IF jsonb_typeof(v_payload->'contract') <> 'object' THEN RAISE EXCEPTION 'payload.contract must be an object'; END IF;
  v_quest := v_payload->'quest';
  v_contract := v_payload->'contract';

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
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash OR v_existing.event_type <> 'challenge.declared' THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    v_contract_id := v_existing.payload->>'contract_id';
    v_quest_key := 'system-challenge-contract:v1:quest:' || v_contract_id;
    SELECT to_jsonb(e) INTO v_quest_event FROM system_events e WHERE e.idempotency_key=v_quest_key;
    IF v_quest_event IS NULL THEN RAISE EXCEPTION 'Challenge replay is missing its Quest event'; END IF;
    RETURN QUERY SELECT true, jsonb_build_array(to_jsonb(v_existing),v_quest_event);
    RETURN;
  END IF;

  IF COALESCE(v_quest->>'quest_version','') <> '2' THEN RAISE EXCEPTION 'Challenge requires Quest v2'; END IF;
  IF v_quest ? 'timing_mode' OR v_quest ? 'challenge_contract' THEN
    RAISE EXCEPTION 'Challenge timing is owned by challenge.create, not nested Quest timing fields';
  END IF;
  v_quest_id := btrim(COALESCE(v_quest->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'Challenge quest_id is required'; END IF;
  IF btrim(COALESCE(v_quest->>'title',''))='' OR length(v_quest->>'title')>180 THEN RAISE EXCEPTION 'Challenge title is required'; END IF;
  IF COALESCE(v_quest->>'visibility','VISIBLE')='HIDDEN' OR COALESCE(v_quest->>'class','SIDE')='HIDDEN' THEN
    RAISE EXCEPTION 'Challenge must be player-visible';
  END IF;
  BEGIN
    v_deadline := (v_quest->>'deadline_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge deadline_at must be a valid timestamp';
  END;
  IF v_deadline <= clock_timestamp() THEN RAISE EXCEPTION 'Challenge deadline_at must be in the future'; END IF;

  BEGIN
    v_contract_id := ((v_contract->>'contract_id')::uuid)::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge contract_id must be a UUID';
  END;
  IF v_contract->>'contract_id' <> v_contract_id THEN RAISE EXCEPTION 'Challenge contract_id must be canonical lowercase UUID'; END IF;
  v_recovery_title := btrim(COALESCE(v_contract->>'recovery_title',''));
  v_recovery_objective := btrim(COALESCE(v_contract->>'recovery_objective',''));
  IF v_recovery_title='' OR length(v_recovery_title)>180 THEN RAISE EXCEPTION 'Challenge recovery_title is invalid'; END IF;
  IF v_recovery_objective='' OR length(v_recovery_objective)>180 THEN RAISE EXCEPTION 'Challenge recovery_objective is invalid'; END IF;
  IF COALESCE(v_contract->>'recovery_target','1') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Challenge recovery_target is invalid'; END IF;
  v_recovery_target := COALESCE((v_contract->>'recovery_target')::bigint,1);
  IF v_recovery_target<1 OR v_recovery_target>1000000000 THEN RAISE EXCEPTION 'Challenge recovery_target is invalid'; END IF;
  v_recovery_unit := btrim(COALESCE(v_contract->>'recovery_unit','count'));
  IF v_recovery_unit='' OR length(v_recovery_unit)>40 THEN RAISE EXCEPTION 'Challenge recovery_unit is invalid'; END IF;
  v_recovery_quest_id := 'challenge-recovery:' || v_contract_id;
  v_recovery_objective_id := 'challenge-recovery-objective:' || v_contract_id;
  v_quest_key := 'system-challenge-contract:v1:quest:' || v_contract_id;

  -- Contract first, Quest second, within one PostgreSQL function statement. Any
  -- child failure rolls the declaration back with the surrounding statement.
  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(
    gen_random_uuid(),'challenge.declared',p_actor,p_source,p_source_ref,'derived',p_idempotency_key,v_request_hash,
    jsonb_build_object(
      'policy_ref','system-challenge-contract:v1','contract_id',v_contract_id,'quest_id',v_quest_id,'deadline_at',v_deadline,
      'recovery_quest_id',v_recovery_quest_id,'recovery_objective_id',v_recovery_objective_id,
      'recovery_title',v_recovery_title,'recovery_objective',v_recovery_objective,
      'recovery_target',v_recovery_target,'recovery_unit',v_recovery_unit
    )
  ) RETURNING * INTO v_declared;

  v_quest := jsonb_set(v_quest,'{deadline_at}',to_jsonb(v_deadline),true);
  v_quest := jsonb_set(v_quest,'{visibility}',to_jsonb(COALESCE(v_quest->>'visibility','VISIBLE')),true);
  v_scored := v_quest->'reward_xp' IS NOT NULL AND jsonb_typeof(v_quest->'reward_xp') <> 'null'
    AND v_quest->'reward_coins' IS NOT NULL AND jsonb_typeof(v_quest->'reward_coins') <> 'null'
    AND system_source_ref_uses_difficulty_v1(p_source_ref);

  IF v_scored THEN
    SELECT a.event INTO v_quest_event
    FROM system_apply_scored_quest_v1(
      jsonb_build_object('type','quest.create','payload',v_quest),p_actor,p_source,p_source_ref,v_quest_key,v_request_hash
    ) a;
  ELSE
    SELECT a.event INTO v_quest_event
    FROM system_apply_action(
      jsonb_build_object('type','quest.create','payload',v_quest),p_actor,p_source,p_source_ref,v_quest_key,v_request_hash
    ) a;
  END IF;
  IF v_quest_event IS NULL THEN RAISE EXCEPTION 'Challenge Quest creation returned no event'; END IF;

  RETURN QUERY SELECT false, jsonb_build_array(to_jsonb(v_declared),v_quest_event);
END;
$$;

REVOKE ALL ON FUNCTION system_apply_challenge_v1(jsonb,text,text,text,text,text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION system_expire_challenge_v1(
  p_quest_id text,
  p_contract_id text,
  p_actor text DEFAULT 'chatgpt',
  p_source text DEFAULT 'system-deadline-engine',
  p_source_ref text DEFAULT 'system-challenge-contract:v1',
  p_idempotency_key text DEFAULT NULL,
  p_request_hash text DEFAULT NULL
)
RETURNS TABLE(replay boolean, events jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contract_id text;
  v_contract jsonb;
  v_parent jsonb;
  v_existing system_events%ROWTYPE;
  v_request_hash text;
  v_recovery_key text;
  v_expired_event jsonb;
  v_recovery_event jsonb;
  v_recovery_action jsonb;
BEGIN
  p_quest_id := btrim(COALESCE(p_quest_id,''));
  IF p_quest_id='' OR length(p_quest_id)>100 THEN RAISE EXCEPTION 'Challenge quest_id is invalid'; END IF;
  BEGIN
    v_contract_id := (p_contract_id::uuid)::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge contract_id must be a UUID';
  END;
  IF p_contract_id <> v_contract_id THEN RAISE EXCEPTION 'Challenge contract_id must be canonical lowercase UUID'; END IF;
  IF btrim(COALESCE(p_actor,''))='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(p_source,''))='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars';
  END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;

  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('quest_id',p_quest_id,'contract_id',v_contract_id,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );
  v_recovery_key := 'system-challenge-contract:v1:recovery:' || v_contract_id;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash OR v_existing.event_type <> 'quest.expired' THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    SELECT to_jsonb(e) INTO v_recovery_event FROM system_events e WHERE e.idempotency_key=v_recovery_key;
    IF v_recovery_event IS NULL THEN RAISE EXCEPTION 'Challenge expiry replay is missing its recovery Quest'; END IF;
    RETURN QUERY SELECT true, jsonb_build_array(to_jsonb(v_existing),v_recovery_event);
    RETURN;
  END IF;

  SELECT e.payload INTO v_contract
  FROM system_events e
  WHERE e.event_type='challenge.declared'
    AND e.payload->>'contract_id'=v_contract_id
    AND e.payload->>'quest_id'=p_quest_id
  ORDER BY e.seq ASC LIMIT 1;
  IF v_contract IS NULL THEN RAISE EXCEPTION 'Challenge contract does not exist for quest'; END IF;

  SELECT e.payload INTO v_parent
  FROM system_events e
  WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=p_quest_id
  ORDER BY e.seq ASC LIMIT 1;
  IF v_parent IS NULL OR COALESCE(v_parent->>'quest_version','') <> '2' THEN RAISE EXCEPTION 'Challenge Quest v2 does not exist'; END IF;
  IF (v_parent->>'deadline_at')::timestamptz <> (v_contract->>'deadline_at')::timestamptz THEN
    RAISE EXCEPTION 'Challenge deadline does not match its Quest deadline';
  END IF;
  IF clock_timestamp() < (v_parent->>'deadline_at')::timestamptz THEN RAISE EXCEPTION 'Challenge deadline has not passed'; END IF;

  SELECT a.event INTO v_expired_event
  FROM system_apply_action(
    jsonb_build_object('type','quest.expire','payload',jsonb_build_object(
      'quest_id',p_quest_id,'reason','Срок испытания истёк; активирован заранее согласованный recovery-контракт'
    )),p_actor,p_source,p_source_ref,p_idempotency_key,v_request_hash
  ) a;
  IF v_expired_event IS NULL THEN RAISE EXCEPTION 'Challenge expiry returned no event'; END IF;

  v_recovery_action := jsonb_build_object(
    'type','quest.create',
    'payload',jsonb_build_object(
      'quest_id',v_contract->>'recovery_quest_id',
      'quest_version',2,
      'title',v_contract->>'recovery_title',
      'description','Восстановительное действие после испытания «' || left(COALESCE(v_parent->>'title',''),120) || '». Верни траекторию без потери уже заработанного прогресса.',
      'class','RECOVERY','rank','E','reward_xp',NULL,'reward_coins',NULL,
      'objectives',jsonb_build_array(jsonb_build_object(
        'objective_id',v_contract->>'recovery_objective_id','title',v_contract->>'recovery_objective',
        'target',(v_contract->>'recovery_target')::bigint,'unit',v_contract->>'recovery_unit','required',true
      )),
      'deadline_at',NULL,'visibility','VISIBLE'
    )
  );

  SELECT a.event INTO v_recovery_event
  FROM system_apply_action(v_recovery_action,p_actor,p_source,'system-challenge-contract:v1',v_recovery_key,v_request_hash) a;
  IF v_recovery_event IS NULL THEN RAISE EXCEPTION 'Challenge recovery creation returned no event'; END IF;

  RETURN QUERY SELECT false, jsonb_build_array(v_expired_event,v_recovery_event);
END;
$$;

REVOKE ALL ON FUNCTION system_expire_challenge_v1(text,text,text,text,text,text,text) FROM PUBLIC;
