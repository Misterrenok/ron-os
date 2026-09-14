-- Delivery infrastructure only. Quest and notification truth remains in system_events.
CREATE TABLE IF NOT EXISTS system_push_subscriptions (
  subscription_hash text PRIMARY KEY,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  disabled_at timestamptz
);

CREATE TABLE IF NOT EXISTS system_push_deliveries (
  notification_event_id uuid NOT NULL REFERENCES system_events(event_id) ON DELETE CASCADE,
  subscription_hash text NOT NULL REFERENCES system_push_subscriptions(subscription_hash) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','RETRY','SENT','DEAD')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  lease_until timestamptz,
  sent_at timestamptz,
  last_error text,
  PRIMARY KEY (notification_event_id, subscription_hash)
);

CREATE INDEX IF NOT EXISTS system_push_deliveries_claim_idx
  ON system_push_deliveries (next_attempt_at, notification_event_id)
  WHERE status IN ('PENDING','RETRY','PROCESSING');

-- Timing/Pressure v2 hardening for the one canonical PostgreSQL action gate.
-- Keep the Quest v2 implementation private, then expose the same public
-- system_apply_action(...) entrypoint with timing validation in front of it.
DO $copy_quest_v2_gate$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;
  v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_timing_v2_inner(');
  IF v_new_def = v_def THEN
    v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_timing_v2_inner(');
  END IF;
  IF v_new_def = v_def THEN
    RAISE EXCEPTION 'could not clone system_apply_action for Timing/Pressure v2 guard';
  END IF;
  EXECUTE v_new_def;
END;
$copy_quest_v2_gate$;

REVOKE ALL ON FUNCTION system_apply_action_timing_v2_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_is_structured_create boolean;
  v_deadline timestamptz;
  v_timing_mode text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN
    RAISE EXCEPTION 'action body must be an object';
  END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;
  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);

  v_is_structured_create := v_type='quest.create' AND (
    v_payload ? 'quest_version' OR v_payload ? 'objectives' OR v_payload ? 'deadline_at' OR v_payload ? 'visibility'
  );

  IF v_type='quest.create'
     AND (v_payload ? 'timing_mode' OR v_payload ? 'challenge_contract')
     AND NOT v_is_structured_create THEN
    RAISE EXCEPTION 'timing fields require a Quest v2 create';
  END IF;

  IF v_is_structured_create THEN
    IF v_payload ? 'deadline_at' AND jsonb_typeof(v_payload->'deadline_at') <> 'null' THEN
      BEGIN
        v_deadline := (v_payload->>'deadline_at')::timestamptz;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'payload.deadline_at must be a valid timestamp or null';
      END;
    ELSE
      v_deadline := NULL;
    END IF;

    v_timing_mode := NULLIF(btrim(COALESCE(v_payload->>'timing_mode','')), '');

    IF v_deadline IS NOT NULL THEN
      IF v_timing_mode IS NULL THEN
        RAISE EXCEPTION 'payload.timing_mode is required when payload.deadline_at is set';
      END IF;
      IF v_timing_mode NOT IN ('HARD_EXTERNAL','CHALLENGE') THEN
        RAISE EXCEPTION 'deadline-bearing Quest v2 requires timing_mode HARD_EXTERNAL or CHALLENGE';
      END IF;
      IF v_timing_mode = 'CHALLENGE' THEN
        RAISE EXCEPTION 'CHALLENGE timing is not activated in the current runtime; use HARD_EXTERNAL only for a real external deadline or create the quest without a deadline';
      END IF;
    ELSE
      v_timing_mode := COALESCE(v_timing_mode, 'NONE');
      IF v_timing_mode <> 'NONE' THEN
        RAISE EXCEPTION 'payload.timing_mode % requires payload.deadline_at', v_timing_mode;
      END IF;
    END IF;

    IF v_payload ? 'challenge_contract' AND jsonb_typeof(v_payload->'challenge_contract') <> 'null' THEN
      RAISE EXCEPTION 'payload.challenge_contract is allowed only after CHALLENGE runtime activation';
    END IF;
  END IF;

  RETURN QUERY
    SELECT * FROM system_apply_action_timing_v2_inner(
      p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
    );
END;
$$;
