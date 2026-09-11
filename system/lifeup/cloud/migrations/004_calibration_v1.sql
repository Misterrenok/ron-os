CREATE OR REPLACE FUNCTION system_level_snapshot_v1(p_xp bigint)
RETURNS TABLE(level_value bigint, xp_to_next bigint)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_level bigint;
  v_next_threshold numeric;
BEGIN
  IF p_xp IS NULL OR p_xp < 0 THEN
    RAISE EXCEPTION 'xp must be a non-negative integer';
  END IF;
  v_level := floor((1 + sqrt(1 + (4 * p_xp::numeric / 250))) / 2)::bigint;
  IF v_level < 1 THEN v_level := 1; END IF;
  WHILE (250::numeric * (v_level + 1) * v_level) <= p_xp LOOP
    v_level := v_level + 1;
  END LOOP;
  WHILE (250::numeric * v_level * (v_level - 1)) > p_xp LOOP
    v_level := v_level - 1;
  END LOOP;
  v_next_threshold := 250::numeric * (v_level + 1) * v_level;
  RETURN QUERY SELECT v_level, (v_next_threshold - p_xp)::bigint;
END;
$$;

CREATE OR REPLACE FUNCTION system_quest_reward_v1(p_rank text)
RETURNS TABLE(xp bigint, coins bigint)
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT * FROM (
    VALUES
      ('E'::text, 5::bigint, 0::bigint),
      ('D'::text, 10::bigint, 0::bigint),
      ('C'::text, 20::bigint, 1::bigint),
      ('B'::text, 40::bigint, 2::bigint),
      ('A'::text, 80::bigint, 4::bigint),
      ('S'::text, 160::bigint, 8::bigint)
  ) AS rewards(rank_value, xp_value, coin_value)
  WHERE rank_value = p_rank
$$;

CREATE OR REPLACE FUNCTION system_calibration_v1_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expected_xp bigint;
  v_expected_coins bigint;
  v_status text;
  v_total_xp bigint;
  v_level bigint;
  v_xp_to_next bigint;
  v_basis system_events%ROWTYPE;
  v_created system_events%ROWTYPE;
  v_quest_id text;
BEGIN
  IF NEW.event_type = 'quest.created' THEN
    IF jsonb_typeof(NEW.payload->'reward_xp') = 'null' AND jsonb_typeof(NEW.payload->'reward_coins') = 'null' THEN
      RETURN NEW;
    END IF;
    IF jsonb_typeof(NEW.payload->'reward_xp') = 'null' OR jsonb_typeof(NEW.payload->'reward_coins') = 'null' THEN
      RAISE EXCEPTION 'scored quest requires both reward_xp and reward_coins';
    END IF;
    SELECT e.payload->>'economy_status' INTO v_status
      FROM system_events e
      WHERE e.event_type = 'profile.calibrated' AND e.payload ? 'economy_status'
      ORDER BY e.seq DESC LIMIT 1;
    IF COALESCE(v_status, 'UNCALIBRATED') <> 'CALIBRATED' THEN
      RAISE EXCEPTION 'scored quest requires calibrated economy';
    END IF;
    SELECT r.xp, r.coins INTO v_expected_xp, v_expected_coins
      FROM system_quest_reward_v1(NEW.payload->>'rank') r;
    IF NOT FOUND THEN RAISE EXCEPTION 'quest rank has no calibrated reward'; END IF;
    IF (NEW.payload->>'reward_xp')::bigint <> v_expected_xp OR (NEW.payload->>'reward_coins')::bigint <> v_expected_coins THEN
      RAISE EXCEPTION 'quest reward does not match system-quest-reward:v1';
    END IF;
    NEW.payload := NEW.payload || jsonb_build_object('reward_policy_ref','system-quest-reward:v1');

  ELSIF NEW.event_type = 'progression.awarded' THEN
    SELECT * INTO v_basis FROM system_events e WHERE e.event_id::text = NEW.payload->>'basis_event_id';
    IF NOT FOUND THEN RETURN NEW; END IF;
    v_quest_id := v_basis.payload->>'quest_id';
    SELECT * INTO v_created FROM system_events e
      WHERE e.event_type='quest.created' AND e.payload->>'quest_id'=v_quest_id
      ORDER BY e.seq ASC LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'rewarded quest creation event is missing'; END IF;
    IF COALESCE(v_created.payload->>'reward_policy_ref','') <> 'system-quest-reward:v1' THEN
      RAISE EXCEPTION 'quest is not scored under system-quest-reward:v1';
    END IF;
    SELECT r.xp, r.coins INTO v_expected_xp, v_expected_coins
      FROM system_quest_reward_v1(v_created.payload->>'rank') r;
    IF (NEW.payload->>'xp')::bigint <> v_expected_xp OR (NEW.payload->>'coins')::bigint <> v_expected_coins THEN
      RAISE EXCEPTION 'progression award does not match scored quest reward';
    END IF;
    NEW.payload := NEW.payload || jsonb_build_object('reward_policy_ref','system-quest-reward:v1');

  ELSIF NEW.event_type = 'profile.calibrated' THEN
    SELECT COALESCE(sum((e.payload->>'xp')::bigint),0) INTO v_total_xp
      FROM system_events e
      WHERE e.event_type='progression.awarded' AND e.claim_status='verified';
    SELECT s.level_value, s.xp_to_next INTO v_level, v_xp_to_next
      FROM system_level_snapshot_v1(v_total_xp) s;

    IF NEW.payload ? 'level' OR NEW.payload ? 'xp_to_next' OR NEW.payload->>'economy_status' = 'CALIBRATED' THEN
      IF jsonb_typeof(NEW.payload->'level') = 'null' OR jsonb_typeof(NEW.payload->'xp_to_next') = 'null' THEN
        RAISE EXCEPTION 'economy/level calibration requires derived level and xp_to_next';
      END IF;
      IF NOT (NEW.payload ? 'level') OR NOT (NEW.payload ? 'xp_to_next') THEN
        RAISE EXCEPTION 'economy/level calibration requires derived level and xp_to_next';
      END IF;
      IF (NEW.payload->>'level')::bigint <> v_level OR (NEW.payload->>'xp_to_next')::bigint <> v_xp_to_next THEN
        RAISE EXCEPTION 'level/xp_to_next must match system-level-xp:v1';
      END IF;
      NEW.payload := NEW.payload || jsonb_build_object('level_policy_ref','system-level-xp:v1');
    END IF;

    IF NEW.payload->>'economy_status' = 'CALIBRATED' THEN
      NEW.payload := NEW.payload || jsonb_build_object('reward_policy_ref','system-quest-reward:v1');
    END IF;
    IF NEW.payload ? 'rank' AND jsonb_typeof(NEW.payload->'rank') <> 'null' THEN
      NEW.payload := NEW.payload || jsonb_build_object('rank_policy_ref','system-rank-review:v1');
    END IF;

  ELSIF NEW.event_type = 'attribute.set' THEN
    IF COALESCE(NEW.payload->>'scale_ref','') <> 'system-attribute-ordinal5:v1' THEN
      RAISE EXCEPTION 'attribute scale_ref must be system-attribute-ordinal5:v1';
    END IF;
    IF jsonb_typeof(NEW.payload->'value') <> 'null' AND ((NEW.payload->>'value')::bigint < 1 OR (NEW.payload->>'value')::bigint > 5) THEN
      RAISE EXCEPTION 'attribute value must be 1..5 or null';
    END IF;

  ELSIF NEW.event_type = 'skill.upserted' THEN
    IF jsonb_typeof(NEW.payload->'level') <> 'null' THEN
      IF COALESCE(NEW.payload->>'scale_ref','') <> 'system-skill-competency5:v1' THEN
        RAISE EXCEPTION 'skill scale_ref must be system-skill-competency5:v1';
      END IF;
      IF (NEW.payload->>'level')::bigint < 1 OR (NEW.payload->>'level')::bigint > 5 THEN
        RAISE EXCEPTION 'skill level must be 1..5 or null';
      END IF;
    ELSIF NEW.payload->>'scale_ref' IS NOT NULL AND COALESCE(NEW.payload->>'scale_ref','') <> 'system-skill-competency5:v1' THEN
      RAISE EXCEPTION 'skill scale_ref must be system-skill-competency5:v1 when provided';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_system_events_calibration_v1 ON system_events;
CREATE TRIGGER zz_system_events_calibration_v1
  BEFORE INSERT ON system_events
  FOR EACH ROW EXECUTE FUNCTION system_calibration_v1_guard();
