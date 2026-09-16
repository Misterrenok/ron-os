-- Evidence Follow-through v1.
-- Keep Quest v2 numeric progress monotonic while permitting exactly one
-- same-value evidence-quality upgrade from REPORTED to VERIFIED.
-- 005_quest_v2.sql is intentionally still the base Quest v2 migration; this
-- migration patches only its progress validator and is safe to re-run.

DO $evidence_followthrough_v1$
DECLARE
  v_def text;
  v_new_def text;
  v_old text := $$    IF v_value <= v_previous THEN RAISE EXCEPTION 'progress must strictly increase'; END IF;$$;
  v_new text := $$    IF v_value < v_previous THEN
      RAISE EXCEPTION 'progress must strictly increase unless verifying reported progress';
    END IF;
    IF v_value = v_previous THEN
      IF NEW.claim_status <> 'verified' OR COALESCE((
        SELECT e.claim_status
        FROM system_events e
        WHERE e.event_type='quest.progressed'
          AND e.payload->>'quest_id'=v_quest_id
          AND e.payload->>'objective_id'=v_objective_id
        ORDER BY e.seq DESC
        LIMIT 1
      ), '') <> 'reported' THEN
        RAISE EXCEPTION 'progress must strictly increase unless verifying reported progress';
      END IF;
    END IF;$$;
BEGIN
  SELECT pg_get_functiondef('system_validate_quest_v2_event()'::regprocedure) INTO v_def;

  IF position('progress must strictly increase unless verifying reported progress' in v_def) > 0 THEN
    RETURN;
  END IF;

  v_new_def := replace(v_def, v_old, v_new);
  IF v_new_def = v_def THEN
    RAISE EXCEPTION 'could not patch Quest v2 progress validator for Evidence Follow-through v1';
  END IF;

  EXECUTE v_new_def;
END;
$evidence_followthrough_v1$;
