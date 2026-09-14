-- Stable scored-outcome identity for Quest v2 anti-farming.
-- Historical Quest v2 events remain append-only. Their identity can be recovered
-- from the old source_ref/description marker until all new scored quests persist
-- payload.outcome_key directly.

CREATE OR REPLACE FUNCTION system_source_ref_uses_difficulty_v1(p_source_ref text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    p_source_ref LIKE 'system-quest-difficulty:v1%'
    OR position('policy=system-quest-difficulty%3Av1' IN p_source_ref) > 0
    OR position('policy=system-quest-difficulty:v1' IN p_source_ref) > 0,
    false
  );
$$;

CREATE OR REPLACE FUNCTION system_event_outcome_key_v1(p_payload jsonb, p_source_ref text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key text;
  v_match text[];
BEGIN
  v_key := NULLIF(btrim(COALESCE(p_payload->>'outcome_key','')), '');

  IF v_key IS NULL AND p_source_ref IS NOT NULL THEN
    v_match := regexp_match(
      p_source_ref,
      '(?:^|[;?&])outcome_key=([a-z0-9][a-z0-9._:/-]{0,199})(?:[;&]|$)'
    );
    IF v_match IS NOT NULL THEN v_key := v_match[1]; END IF;
  END IF;

  IF v_key IS NULL AND p_payload->>'description' IS NOT NULL THEN
    v_match := regexp_match(
      p_payload->>'description',
      '(?:^|[[:space:]])outcome_key=([a-z0-9][a-z0-9._:/-]{0,199})(?:[[:space:]]|$)'
    );
    IF v_match IS NOT NULL THEN v_key := v_match[1]; END IF;
  END IF;

  IF v_key IS NULL OR length(v_key) > 200 OR v_key !~ '^[a-z0-9][a-z0-9._:/-]*$' THEN
    RETURN NULL;
  END IF;
  RETURN v_key;
END;
$$;

CREATE INDEX IF NOT EXISTS system_events_quest_outcome_key_lookup
  ON system_events ((system_event_outcome_key_v1(payload, source_ref)), seq)
  WHERE event_type='quest.created';

CREATE OR REPLACE FUNCTION system_validate_outcome_key_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key text;
  v_policy_managed boolean;
  v_scored boolean;
BEGIN
  IF NEW.event_type <> 'quest.created' OR COALESCE(NEW.payload->>'quest_version','') <> '2' THEN
    RETURN NEW;
  END IF;

  v_scored := NEW.payload->'reward_xp' IS NOT NULL
    AND jsonb_typeof(NEW.payload->'reward_xp') <> 'null'
    AND NEW.payload->'reward_coins' IS NOT NULL
    AND jsonb_typeof(NEW.payload->'reward_coins') <> 'null';
  v_policy_managed := system_source_ref_uses_difficulty_v1(NEW.source_ref);
  v_key := NULLIF(current_setting('ron.outcome_key', true), '');

  IF v_policy_managed AND v_scored AND v_key IS NULL THEN
    RAISE EXCEPTION 'scored system-quest-difficulty:v1 quest requires outcome_key gate';
  END IF;
  IF v_key IS NULL THEN RETURN NEW; END IF;

  v_key := btrim(v_key);
  IF length(v_key) < 1 OR length(v_key) > 200 OR v_key !~ '^[a-z0-9][a-z0-9._:/-]*$' THEN
    RAISE EXCEPTION 'outcome_key is invalid';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quest-outcome:' || v_key, 0));

  IF EXISTS (
    SELECT 1
    FROM system_events created
    WHERE created.event_type='quest.created'
      AND system_event_outcome_key_v1(created.payload, created.source_ref)=v_key
      AND NOT EXISTS (
        SELECT 1
        FROM system_events terminal
        WHERE terminal.payload->>'quest_id'=created.payload->>'quest_id'
          AND terminal.event_type IN ('quest.cancelled','quest.failed','quest.expired')
      )
  ) THEN
    RAISE EXCEPTION 'scored outcome is already active or completed';
  END IF;

  NEW.payload := jsonb_set(NEW.payload, '{outcome_key}', to_jsonb(v_key), true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zy_system_events_outcome_key_v1 ON system_events;
CREATE TRIGGER zy_system_events_outcome_key_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (NEW.event_type='quest.created' AND COALESCE(NEW.payload->>'quest_version','')='2')
  EXECUTE FUNCTION system_validate_outcome_key_v1();

CREATE OR REPLACE FUNCTION system_apply_scored_quest_v1(
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
  v_payload jsonb;
  v_key text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' OR p_action->>'type' <> 'quest.create' THEN
    RAISE EXCEPTION 'system_apply_scored_quest_v1 requires quest.create';
  END IF;
  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);
  IF COALESCE(v_payload->>'quest_version','') <> '2' THEN
    RAISE EXCEPTION 'scored outcome gate requires Quest v2';
  END IF;
  IF v_payload->'reward_xp' IS NULL OR jsonb_typeof(v_payload->'reward_xp')='null'
     OR v_payload->'reward_coins' IS NULL OR jsonb_typeof(v_payload->'reward_coins')='null' THEN
    RAISE EXCEPTION 'scored outcome gate requires reward_xp and reward_coins';
  END IF;
  IF NOT system_source_ref_uses_difficulty_v1(p_source_ref) THEN
    RAISE EXCEPTION 'scored outcome gate requires system-quest-difficulty:v1 provenance';
  END IF;

  v_key := btrim(COALESCE(v_payload->>'outcome_key',''));
  IF v_key='' OR length(v_key)>200 OR v_key !~ '^[a-z0-9][a-z0-9._:/-]*$' THEN
    RAISE EXCEPTION 'payload.outcome_key is required and must be normalized';
  END IF;

  PERFORM set_config('ron.outcome_key', v_key, true);
  RETURN QUERY
    SELECT * FROM system_apply_action(
      p_action - 'payload' || jsonb_build_object('payload', v_payload - 'outcome_key'),
      p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
    );
END;
$$;

REVOKE ALL ON FUNCTION system_apply_scored_quest_v1(jsonb,text,text,text,text,text) FROM PUBLIC;
