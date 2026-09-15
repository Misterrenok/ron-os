-- Reward Economy v2.
-- Coins remain an internal scarce token, never a currency conversion.
-- REAL_WORLD_CHOICE redemption records an internal unlock only and requires a fresh
-- finance gate; it never performs or authorizes the external purchase/payment.

DO $install_reward_v2_inner$
DECLARE
  v_def text;
  v_new_def text;
BEGIN
  SELECT pg_get_functiondef('system_apply_action(jsonb,text,text,text,text,text)'::regprocedure) INTO v_def;

  IF position('system_apply_action_reward_v2_inner' IN v_def) = 0 THEN
    v_new_def := replace(v_def, 'FUNCTION public.system_apply_action(', 'FUNCTION public.system_apply_action_reward_v2_inner(');
    IF v_new_def = v_def THEN
      v_new_def := replace(v_def, 'FUNCTION system_apply_action(', 'FUNCTION system_apply_action_reward_v2_inner(');
    END IF;
    IF v_new_def = v_def THEN
      RAISE EXCEPTION 'could not clone system_apply_action for reward economy v2';
    END IF;
    EXECUTE v_new_def;
  ELSIF to_regprocedure('system_apply_action_reward_v2_inner(jsonb,text,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'reward v2 wrapper exists without its inner implementation';
  END IF;
END;
$install_reward_v2_inner$;

REVOKE ALL ON FUNCTION system_apply_action_reward_v2_inner(jsonb,text,text,text,text,text) FROM PUBLIC;

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
  v_request_hash text;
  v_existing system_events%ROWTYPE;
  v_inserted system_events%ROWTYPE;
  v_item_payload jsonb;
  v_item_id text;
  v_title text;
  v_description text;
  v_reward_type text;
  v_external_value text;
  v_fulfillment_mode text;
  v_finance_required boolean;
  v_finance_mode text;
  v_cost bigint;
  v_active boolean;
  v_repeatable boolean;
  v_redemption_id text;
  v_note text;
  v_gate jsonb;
  v_checked_at timestamptz;
  v_currency text;
  v_max_spend numeric;
  v_evidence_ref text;
BEGIN
  IF p_action IS NULL OR jsonb_typeof(p_action) <> 'object' THEN
    RAISE EXCEPTION 'action body must be an object';
  END IF;
  v_type := btrim(COALESCE(p_action->>'type',''));
  IF v_type='' OR length(v_type)>80 THEN RAISE EXCEPTION 'type is required'; END IF;

  IF v_type NOT IN ('shop.item.upsert','shop.redeem') THEN
    RETURN QUERY
      SELECT * FROM system_apply_action_reward_v2_inner(
        p_action,p_actor,p_source,p_source_ref,p_idempotency_key,p_request_hash
      );
    RETURN;
  END IF;

  IF p_action ? 'payload' AND jsonb_typeof(p_action->'payload') <> 'object' THEN
    RAISE EXCEPTION 'payload must be an object';
  END IF;
  v_payload := COALESCE(p_action->'payload','{}'::jsonb);

  IF v_payload ?| ARRAY['coin_rate','coin_to_currency','coins_per_currency','currency_per_coin','cash_value','money_value'] THEN
    RAISE EXCEPTION 'fixed Coin-to-money conversion fields are forbidden';
  END IF;
  IF btrim(COALESCE(p_actor,''))='' OR length(p_actor)>80 THEN RAISE EXCEPTION 'actor is required'; END IF;
  IF btrim(COALESCE(p_source,''))='' OR length(p_source)>80 THEN RAISE EXCEPTION 'source is required'; END IF;
  IF p_source_ref IS NOT NULL AND length(p_source_ref)>500 THEN RAISE EXCEPTION 'source_ref is too long'; END IF;
  IF p_idempotency_key IS NULL OR length(p_idempotency_key)<8 OR length(p_idempotency_key)>200 THEN
    RAISE EXCEPTION 'idempotency key is required and must be 8..200 chars';
  END IF;
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN
    RAISE EXCEPTION 'request_hash is invalid';
  END IF;

  v_request_hash := COALESCE(
    p_request_hash,
    'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text)
  );
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  SELECT * INTO v_existing FROM system_events e WHERE e.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'Idempotency-Key was already used for a different action' USING ERRCODE='23505';
    END IF;
    RETURN QUERY SELECT true, to_jsonb(v_existing);
    RETURN;
  END IF;

  IF v_type = 'shop.item.upsert' THEN
    v_item_id := btrim(COALESCE(v_payload->>'item_id',gen_random_uuid()::text));
    IF v_item_id='' OR length(v_item_id)>100 THEN RAISE EXCEPTION 'payload.item_id is invalid'; END IF;
    v_title := btrim(COALESCE(v_payload->>'title',''));
    IF v_title='' OR length(v_title)>180 THEN RAISE EXCEPTION 'payload.title is invalid'; END IF;
    v_description := left(btrim(COALESCE(v_payload->>'description','')),1200);

    IF COALESCE(v_payload->>'cost_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.cost_coins is invalid'; END IF;
    v_cost := (v_payload->>'cost_coins')::bigint;
    IF v_cost NOT IN (1,2,4,8,16) THEN RAISE EXCEPTION 'payload.cost_coins must be one of 1,2,4,8,16'; END IF;

    IF v_payload ? 'active' THEN
      IF jsonb_typeof(v_payload->'active') <> 'boolean' THEN RAISE EXCEPTION 'payload.active must be boolean'; END IF;
      v_active := (v_payload->>'active')::boolean;
    ELSE v_active := true; END IF;
    IF v_payload ? 'repeatable' THEN
      IF jsonb_typeof(v_payload->'repeatable') <> 'boolean' THEN RAISE EXCEPTION 'payload.repeatable must be boolean'; END IF;
      v_repeatable := (v_payload->>'repeatable')::boolean;
    ELSE v_repeatable := false; END IF;
    IF v_repeatable THEN RAISE EXCEPTION 'reward economy v2 shop items must be non-repeatable'; END IF;

    v_reward_type := COALESCE(v_payload->>'reward_type','COSMETIC');
    IF v_reward_type NOT IN ('COSMETIC','REAL_WORLD_CHOICE') THEN RAISE EXCEPTION 'payload.reward_type is invalid'; END IF;
    v_external_value := COALESCE(v_payload->>'external_value', CASE WHEN v_reward_type='COSMETIC' THEN 'NONE' ELSE '' END);
    v_fulfillment_mode := COALESCE(v_payload->>'fulfillment_mode', CASE WHEN v_reward_type='COSMETIC' THEN 'SYSTEM' ELSE '' END);

    IF v_payload ? 'finance_gate_required' THEN
      IF jsonb_typeof(v_payload->'finance_gate_required') <> 'boolean' THEN RAISE EXCEPTION 'payload.finance_gate_required must be boolean'; END IF;
      v_finance_required := (v_payload->>'finance_gate_required')::boolean;
    ELSE v_finance_required := false; END IF;
    v_finance_mode := NULLIF(btrim(COALESCE(v_payload->>'finance_gate_mode','')),'');

    IF v_reward_type='COSMETIC' THEN
      IF v_external_value <> 'NONE' THEN RAISE EXCEPTION 'COSMETIC external_value must be NONE'; END IF;
      IF v_fulfillment_mode <> 'SYSTEM' THEN RAISE EXCEPTION 'COSMETIC fulfillment_mode must be SYSTEM'; END IF;
      IF v_finance_required OR v_finance_mode IS NOT NULL THEN RAISE EXCEPTION 'COSMETIC cannot require a finance gate'; END IF;
    ELSE
      IF v_external_value <> 'BUDGET_GATED' THEN RAISE EXCEPTION 'REAL_WORLD_CHOICE external_value must be BUDGET_GATED'; END IF;
      IF v_fulfillment_mode <> 'RON' THEN RAISE EXCEPTION 'REAL_WORLD_CHOICE fulfillment_mode must be RON'; END IF;
      IF NOT v_finance_required THEN RAISE EXCEPTION 'REAL_WORLD_CHOICE requires a redemption-time finance gate'; END IF;
      IF v_finance_mode <> 'CURRENT_DISCRETIONARY_BUDGET' THEN RAISE EXCEPTION 'REAL_WORLD_CHOICE finance_gate_mode is invalid'; END IF;
    END IF;

    INSERT INTO system_events(
      event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload
    ) VALUES (
      gen_random_uuid(),'shop.item.upserted',p_actor,p_source,p_source_ref,'derived',p_idempotency_key,v_request_hash,
      jsonb_build_object(
        'item_id',v_item_id,'title',v_title,'description',v_description,'cost_coins',v_cost,
        'active',v_active,'repeatable',false,'reward_type',v_reward_type,'external_value',v_external_value,
        'fulfillment_mode',v_fulfillment_mode,'finance_gate_required',v_finance_required,
        'finance_gate_mode',v_finance_mode,'external_action_authorized',false
      )
    ) RETURNING * INTO v_inserted;

    RETURN QUERY SELECT false, to_jsonb(v_inserted);
    RETURN;
  END IF;

  -- shop.redeem
  v_item_id := btrim(COALESCE(v_payload->>'item_id',''));
  IF v_item_id='' OR length(v_item_id)>100 THEN RAISE EXCEPTION 'payload.item_id is required'; END IF;
  v_redemption_id := btrim(COALESCE(v_payload->>'redemption_id',gen_random_uuid()::text));
  IF v_redemption_id='' OR length(v_redemption_id)>100 THEN RAISE EXCEPTION 'payload.redemption_id is invalid'; END IF;
  v_note := left(btrim(COALESCE(v_payload->>'note','')),500);

  SELECT e.payload INTO v_item_payload
  FROM system_events e
  WHERE e.event_type='shop.item.upserted' AND e.payload->>'item_id'=v_item_id
  ORDER BY e.seq DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'shop item does not exist'; END IF;
  IF jsonb_typeof(v_item_payload->'cost_coins')='null' OR v_item_payload->>'cost_coins' IS NULL THEN
    RAISE EXCEPTION 'shop item cost is uncalibrated';
  END IF;
  v_cost := (v_item_payload->>'cost_coins')::bigint;
  v_reward_type := COALESCE(v_item_payload->>'reward_type','COSMETIC');
  v_finance_required := COALESCE((v_item_payload->>'finance_gate_required')::boolean,false);

  IF v_reward_type='REAL_WORLD_CHOICE' OR v_finance_required THEN
    IF NOT (v_payload ? 'finance_gate') OR jsonb_typeof(v_payload->'finance_gate') <> 'object' THEN
      RAISE EXCEPTION 'REAL_WORLD_CHOICE requires finance_gate';
    END IF;
    v_gate := v_payload->'finance_gate';
    IF v_gate ?| ARRAY['coin_rate','coin_to_currency','coins_per_currency','currency_per_coin','cash_value','money_value'] THEN
      RAISE EXCEPTION 'fixed Coin-to-money conversion fields are forbidden';
    END IF;
    IF COALESCE(v_gate->>'status','') <> 'APPROVED' THEN RAISE EXCEPTION 'finance_gate.status must be APPROVED'; END IF;
    IF COALESCE(v_gate->>'mode','') <> 'CURRENT_DISCRETIONARY_BUDGET' THEN RAISE EXCEPTION 'finance_gate.mode is invalid'; END IF;
    BEGIN
      v_checked_at := (v_gate->>'checked_at')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'finance_gate.checked_at is invalid';
    END;
    IF v_checked_at > clock_timestamp() + interval '5 minutes' THEN RAISE EXCEPTION 'finance_gate.checked_at is in the future'; END IF;
    IF v_checked_at < clock_timestamp() - interval '24 hours' THEN RAISE EXCEPTION 'finance gate is stale'; END IF;
    v_currency := upper(btrim(COALESCE(v_gate->>'currency','')));
    IF v_currency !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'finance_gate.currency is invalid'; END IF;
    IF COALESCE(v_gate->>'max_spend','') !~ '^[0-9]+([.][0-9]+)?$' THEN RAISE EXCEPTION 'finance_gate.max_spend is invalid'; END IF;
    v_max_spend := (v_gate->>'max_spend')::numeric;
    IF v_max_spend <= 0 OR v_max_spend > 1000000000 THEN RAISE EXCEPTION 'finance_gate.max_spend is invalid'; END IF;
    v_evidence_ref := btrim(COALESCE(v_gate->>'evidence_ref',''));
    IF v_evidence_ref='' OR length(v_evidence_ref)>500 THEN RAISE EXCEPTION 'finance_gate.evidence_ref is required'; END IF;
    v_gate := jsonb_build_object(
      'status','APPROVED','mode','CURRENT_DISCRETIONARY_BUDGET','checked_at',to_jsonb(v_checked_at),
      'currency',v_currency,'max_spend',v_max_spend,'evidence_ref',v_evidence_ref
    );
  ELSE
    IF v_payload ? 'finance_gate' THEN RAISE EXCEPTION 'COSMETIC redemption must not carry a finance gate'; END IF;
    v_gate := NULL;
  END IF;

  INSERT INTO system_events(
    event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload
  ) VALUES (
    gen_random_uuid(),'shop.redeemed',p_actor,p_source,p_source_ref,'derived',p_idempotency_key,v_request_hash,
    jsonb_strip_nulls(jsonb_build_object(
      'item_id',v_item_id,'redemption_id',v_redemption_id,'note',v_note,'cost_coins',v_cost,
      'item_title',v_item_payload->>'title','reward_type',v_reward_type,'finance_gate',v_gate,
      'external_action_authorized',false
    ))
  ) RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;
