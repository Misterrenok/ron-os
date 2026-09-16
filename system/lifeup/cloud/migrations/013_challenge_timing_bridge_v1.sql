-- Challenge Contract v1 timing bridge.
-- The public Timing v2 guard must continue to reject direct quest.create CHALLENGE.
-- Only system_apply_challenge_v1 may create a deadline-bearing child Quest for an
-- already-validated, atomically persisted Challenge contract. We use a transaction-
-- local setting as a private transport capability; Quest v2 does not persist it.

CREATE OR REPLACE FUNCTION system_challenge_timing_bridge_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.event_type <> 'quest.created' OR COALESCE(NEW.payload->>'quest_version','') <> '2' THEN
    RETURN NEW;
  END IF;

  IF current_setting('ron.challenge_contract_id', true) IS NULL OR current_setting('ron.challenge_contract_id', true) = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.payload->>'quest_id' <> current_setting('ron.challenge_quest_id', true) THEN
    RAISE EXCEPTION 'Challenge timing bridge quest mismatch';
  END IF;

  RETURN NEW;
END;
$$;

-- Preserve the current Timing/Focus/Reward wrapper as the inner implementation.
DO $install_challenge_timing_bridge_inner$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;

  IF position('system_apply_action_challenge_bridge_inner' IN v_def) = 0 THEN
    v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_challenge_bridge_inner(');
    IF v_new_def = v_def THEN
      v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_challenge_bridge_inner(');
    END IF;
    IF v_new_def = v_def THEN
      RAISE EXCEPTION 'could not clone system_apply_action for Challenge timing bridge';
    END IF;
    EXECUTE v_new_def;
  ELSIF to_regprocedure('system_apply_action_challenge_bridge_inner(jsonb,text,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Challenge timing bridge wrapper exists without its inner implementation';
  END IF;
END;
$install_challenge_timing_bridge_inner$;

REVOKE ALL ON FUNCTION system_apply_action_challenge_bridge_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_payload jsonb;
  v_bridge_contract text;
  v_bridge_quest text;
  v_action jsonb;
BEGIN
  v_payload := CASE
    WHEN p_action IS NOT NULL AND jsonb_typeof(p_action)='object' AND jsonb_typeof(p_action->'payload')='object'
      THEN p_action->'payload'
    ELSE '{}'::jsonb
  END;
  v_bridge_contract := NULLIF(current_setting('ron.challenge_contract_id', true), '');
  v_bridge_quest := NULLIF(current_setting('ron.challenge_quest_id', true), '');

  IF p_action->>'type'='quest.create'
     AND v_bridge_contract IS NOT NULL
     AND v_bridge_quest IS NOT NULL
     AND COALESCE(v_payload->>'quest_id','')=v_bridge_quest THEN
    -- The inner Timing v2 wrapper consumes this field. Quest v2's persisted event
    -- payload intentionally omits timing_mode; challenge.declared owns the semantic mode.
    v_action := jsonb_set(p_action, '{payload,timing_mode}', to_jsonb('HARD_EXTERNAL'::text), true);
    RETURN QUERY SELECT * FROM system_apply_action_challenge_bridge_inner(
      v_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
    );
    RETURN;
  END IF;

  RETURN QUERY SELECT * FROM system_apply_action_challenge_bridge_inner(
    p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
  );
END;
$$;

-- Recreate Challenge compound entrypoints so they set/clear the private bridge around
-- their child Quest calls. The original functions from 012 remain the source of all
-- contract validation, atomicity and idempotency; these wrappers delegate after
-- marking the transaction-local validated Challenge identity.
DO $install_challenge_compound_inner$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_challenge_v1(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;
  IF position('system_apply_challenge_v1_inner' IN v_def)=0 THEN
    v_new_def := replace(v_def, 'FUNCTION public.system_apply_challenge_v1(', 'FUNCTION public.system_apply_challenge_v1_inner(');
    IF v_new_def=v_def THEN
      v_new_def := replace(v_def, 'FUNCTION system_apply_challenge_v1(', 'FUNCTION system_apply_challenge_v1_inner(');
    END IF;
    IF v_new_def=v_def THEN RAISE EXCEPTION 'could not clone system_apply_challenge_v1'; END IF;
    EXECUTE v_new_def;
  END IF;
END;
$install_challenge_compound_inner$;

REVOKE ALL ON FUNCTION system_apply_challenge_v1_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_contract_id text;
  v_quest_id text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action)<>'object' OR p_action->>'type'<>'challenge.create' THEN
    RAISE EXCEPTION 'system_apply_challenge_v1 requires challenge.create';
  END IF;
  IF jsonb_typeof(p_action->'payload')<>'object' OR jsonb_typeof(p_action->'payload'->'quest')<>'object'
     OR jsonb_typeof(p_action->'payload'->'contract')<>'object' THEN
    RAISE EXCEPTION 'Challenge payload requires quest and contract objects';
  END IF;
  BEGIN
    v_contract_id := ((p_action->'payload'->'contract'->>'contract_id')::uuid)::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Challenge contract_id must be a UUID';
  END;
  v_quest_id := btrim(COALESCE(p_action->'payload'->'quest'->>'quest_id',''));
  IF v_quest_id='' OR length(v_quest_id)>100 THEN RAISE EXCEPTION 'Challenge quest_id is required'; END IF;

  PERFORM set_config('ron.challenge_contract_id', v_contract_id, true);
  PERFORM set_config('ron.challenge_quest_id', v_quest_id, true);
  RETURN QUERY SELECT * FROM system_apply_challenge_v1_inner(
    p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
  );
END;
$$;

REVOKE ALL ON FUNCTION system_apply_challenge_v1(jsonb,text,text,text,text,text) FROM PUBLIC;
