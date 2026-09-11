-- Stable scored-outcome identity for Quest v2 anti-farming.
-- Historical quests remain valid. New system-quest-difficulty:v1 scored quests
-- must enter through system_apply_scored_quest_v1(...), which supplies the
-- normalized outcome_key to this insert guard without creating a second state owner.

CREATE INDEX IF NOT EXISTS system_events_quest_outcome_key_lookup
  ON system_events ((payload->>'outcome_key'), seq)
  WHERE event_type='quest.created' AND payload ? 'outcome_key';

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
  v_policy_managed := COALESCE(NEW.source_ref,'') LIKE 'system-quest-difficulty:v1%';
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
      AND created.payload->>'outcome_key'=v_key
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
  IF COALESCE(p_source_ref,'') NOT LIKE 'system-quest-difficulty:v1%' THEN
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
