-- Growth Engine v1.
-- Adds one append-only growth mapping to an active Quest v2. The mapping itself
-- grants no XP, skill tier or attribute tier; verified completion/evidence owns growth.

DROP TRIGGER IF EXISTS system_events_validate_insert ON system_events;
CREATE TRIGGER system_events_validate_insert
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type NOT IN (
    'quest.progressed','quest.revealed','quest.failed','quest.expired','quest.focused',
    'challenge.declared','reminder.scheduled','streak.excused','quest.growth.assigned'
  ))
  EXECUTE FUNCTION system_validate_event_insert();

CREATE OR REPLACE FUNCTION system_normalize_growth_skill_v1(p_skill jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id text;
  v_name text;
  v_domain text;
  v_kind text;
BEGIN
  IF p_skill IS NULL OR jsonb_typeof(p_skill) <> 'object' THEN
    RAISE EXCEPTION 'growth skill must be an object';
  END IF;
  v_id := btrim(COALESCE(p_skill->>'skill_id',''));
  IF v_id='' OR length(v_id)>100 OR v_id !~ '^[a-z0-9][a-z0-9._:-]*$' THEN
    RAISE EXCEPTION 'growth skill_id must be normalized lowercase id';
  END IF;
  v_name := btrim(COALESCE(p_skill->>'name',''));
  IF v_name='' OR length(v_name)>160 THEN RAISE EXCEPTION 'growth skill name is invalid'; END IF;
  v_domain := btrim(COALESCE(p_skill->>'domain',''));
  IF v_domain='' OR length(v_domain)>120 THEN RAISE EXCEPTION 'growth skill domain is invalid'; END IF;
  v_kind := COALESCE(p_skill->>'evidence_kind','guided_practice');
  IF v_kind NOT IN ('guided_practice','independent_output','objective_benchmark','difficult_outcome','external_validation','exceptional_milestone') THEN
    RAISE EXCEPTION 'growth skill evidence_kind is invalid';
  END IF;
  RETURN jsonb_build_object('skill_id',v_id,'name',v_name,'domain',v_domain,'evidence_kind',v_kind);
END;
$$;

CREATE OR REPLACE FUNCTION system_normalize_growth_v1(p_growth jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_primary jsonb := NULL;
  v_secondary jsonb := '[]'::jsonb;
  v_attributes jsonb := '[]'::jsonb;
  v_item jsonb;
  v_norm jsonb;
  v_name text;
  v_kind text;
  v_skill_ids text[] := ARRAY[]::text[];
  v_attribute_names text[] := ARRAY[]::text[];
  v_targets integer := 0;
BEGIN
  IF p_growth IS NULL OR jsonb_typeof(p_growth) <> 'object' THEN
    RAISE EXCEPTION 'growth must be an object';
  END IF;
  IF p_growth ? 'policy_ref' AND COALESCE(p_growth->>'policy_ref','') <> 'system-growth:v1' THEN
    RAISE EXCEPTION 'growth.policy_ref is invalid';
  END IF;

  IF p_growth ? 'primary_skill' AND jsonb_typeof(p_growth->'primary_skill') <> 'null' THEN
    v_primary := system_normalize_growth_skill_v1(p_growth->'primary_skill');
    v_skill_ids := array_append(v_skill_ids, v_primary->>'skill_id');
    v_targets := v_targets + 1;
  END IF;

  IF p_growth ? 'secondary_skills' THEN
    IF jsonb_typeof(p_growth->'secondary_skills') <> 'array' OR jsonb_array_length(p_growth->'secondary_skills') > 2 THEN
      RAISE EXCEPTION 'growth.secondary_skills must contain at most 2 skills';
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_growth->'secondary_skills') x(value)
    LOOP
      v_norm := system_normalize_growth_skill_v1(v_item);
      IF v_norm->>'skill_id' = ANY(v_skill_ids) THEN RAISE EXCEPTION 'growth skill ids must be unique'; END IF;
      v_skill_ids := array_append(v_skill_ids, v_norm->>'skill_id');
      v_secondary := v_secondary || jsonb_build_array(v_norm);
      v_targets := v_targets + 1;
    END LOOP;
  END IF;

  IF p_growth ? 'attributes' THEN
    IF jsonb_typeof(p_growth->'attributes') <> 'array' OR jsonb_array_length(p_growth->'attributes') > 2 THEN
      RAISE EXCEPTION 'growth.attributes must contain at most 2 attributes';
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_growth->'attributes') x(value)
    LOOP
      IF jsonb_typeof(v_item) <> 'object' THEN RAISE EXCEPTION 'growth attribute must be an object'; END IF;
      v_name := COALESCE(v_item->>'name','');
      IF v_name NOT IN ('STR','VIT','INT','DISC','CHA') THEN RAISE EXCEPTION 'growth attribute name is invalid'; END IF;
      IF v_name = ANY(v_attribute_names) THEN RAISE EXCEPTION 'growth attributes must be unique'; END IF;
      v_kind := COALESCE(v_item->>'kind','');
      IF v_kind NOT IN ('baseline','repeated_execution','objective_benchmark','difficult_outcome','external_validation','exceptional_milestone') THEN
        RAISE EXCEPTION 'growth attribute kind is invalid';
      END IF;
      v_attribute_names := array_append(v_attribute_names,v_name);
      v_attributes := v_attributes || jsonb_build_array(jsonb_build_object('name',v_name,'kind',v_kind));
      v_targets := v_targets + 1;
    END LOOP;
  END IF;

  IF v_targets = 0 THEN RAISE EXCEPTION 'growth mapping must target at least one skill or attribute'; END IF;

  RETURN jsonb_build_object(
    'policy_ref','system-growth:v1',
    'primary_skill',v_primary,
    'secondary_skills',v_secondary,
    'attributes',v_attributes
  );
END;
$$;

CREATE OR REPLACE FUNCTION system_validate_growth_assignment_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
  v_created jsonb;
  v_growth jsonb;
BEGIN
  IF NEW.event_type <> 'quest.growth.assigned' THEN RETURN NEW; END IF;
  IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'quest.growth.assigned must be derived'; END IF;
  IF jsonb_typeof(NEW.payload) <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  IF btrim(COALESCE(NEW.actor,''))='' OR length(NEW.actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(NEW.source,''))='' OR length(NEW.source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF NEW.source_ref IS NOT NULL AND length(NEW.source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF length(NEW.idempotency_key)<8 OR length(NEW.idempotency_key)>200 THEN RAISE EXCEPTION 'idempotency_key must be 8..200 chars'; END IF;
  IF btrim(COALESCE(NEW.request_hash,''))='' THEN RAISE EXCEPTION 'request_hash is required'; END IF;

  v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'quest_id is required'; END IF;
  IF COALESCE(NEW.payload->>'policy_ref','') <> 'system-growth:v1' THEN RAISE EXCEPTION 'growth policy_ref is invalid'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:' || v_quest_id,0));
  SELECT e.payload INTO v_created
  FROM system_events e
  WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id
  ORDER BY e.seq ASC LIMIT 1;
  IF v_created IS NULL THEN RAISE EXCEPTION 'quest does not exist'; END IF;
  IF COALESCE(v_created->>'quest_version','') <> '2' THEN RAISE EXCEPTION 'quest.growth.assign requires a Quest v2 quest'; END IF;
  IF EXISTS (
    SELECT 1 FROM system_events e
    WHERE e.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
      AND e.payload->>'quest_id'=v_quest_id
  ) THEN RAISE EXCEPTION 'quest is not active'; END IF;
  IF EXISTS (
    SELECT 1 FROM system_events e
    WHERE e.event_type='quest.growth.assigned' AND e.payload->>'quest_id'=v_quest_id
  ) THEN RAISE EXCEPTION 'quest already has a growth mapping'; END IF;

  v_growth := system_normalize_growth_v1(NEW.payload->'growth');
  NEW.payload := jsonb_build_object('quest_id',v_quest_id,'policy_ref','system-growth:v1','growth',v_growth);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_system_events_growth_v1 ON system_events;
CREATE TRIGGER zzz_system_events_growth_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='quest.growth.assigned')
  EXECUTE FUNCTION system_validate_growth_assignment_v1();

DO $install_growth_v1_inner$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;
  IF position('system_apply_action_growth_v1_inner' IN v_def) = 0 THEN
    v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_growth_v1_inner(');
    IF v_new_def = v_def THEN
      v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_growth_v1_inner(');
    END IF;
    IF v_new_def = v_def THEN RAISE EXCEPTION 'could not clone system_apply_action for Growth v1'; END IF;
    EXECUTE v_new_def;
  ELSIF to_regprocedure('system_apply_action_growth_v1_inner(jsonb,text,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Growth v1 wrapper exists without inner implementation';
  END IF;
END;
$install_growth_v1_inner$;

REVOKE ALL ON FUNCTION system_apply_action_growth_v1_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_growth jsonb;
  v_request_hash text;
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN RAISE EXCEPTION 'action body must be an object'; END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;

  IF v_type <> 'quest.growth.assign' THEN
    RETURN QUERY SELECT * FROM system_apply_action_growth_v1_inner(
      p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
    );
    RETURN;
  END IF;

  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN RAISE EXCEPTION 'payload must be an object'; END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);
  IF btrim(COALESCE(p_actor,''))='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(p_source,''))='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars'; END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;

  v_quest_id := btrim(COALESCE(v_payload->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'payload.quest_id is required'; END IF;
  v_growth := system_normalize_growth_v1(v_payload->'growth');
  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true,to_jsonb(v_existing);
    RETURN;
  END IF;

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(
    gen_random_uuid(),'quest.growth.assigned',p_actor,p_source,COALESCE(p_source_ref,'system-growth:v1'),'derived',
    p_idempotency_key,v_request_hash,
    jsonb_build_object('quest_id',v_quest_id,'policy_ref','system-growth:v1','growth',v_growth)
  ) RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false,to_jsonb(v_inserted);
END;
$$;
