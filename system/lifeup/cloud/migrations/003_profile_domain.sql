CREATE UNIQUE INDEX IF NOT EXISTS system_events_achievement_id_unique
  ON system_events ((payload->>'achievement_id'))
  WHERE event_type = 'achievement.unlocked';

CREATE UNIQUE INDEX IF NOT EXISTS system_events_redemption_id_unique
  ON system_events ((payload->>'redemption_id'))
  WHERE event_type = 'shop.redeemed';

CREATE UNIQUE INDEX IF NOT EXISTS system_events_notification_push_unique
  ON system_events ((payload->>'notification_id'))
  WHERE event_type = 'notification.pushed';

CREATE UNIQUE INDEX IF NOT EXISTS system_events_notification_ack_unique
  ON system_events ((payload->>'notification_id'))
  WHERE event_type = 'notification.acknowledged';

CREATE OR REPLACE FUNCTION system_normalize_verified_evidence(
  p_evidence jsonb,
  p_require_ref boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_source text;
  v_ref text;
BEGIN
  IF p_evidence IS NULL OR jsonb_typeof(p_evidence) <> 'object' THEN
    RAISE EXCEPTION 'verified evidence is required';
  END IF;
  IF COALESCE(p_evidence->>'status','reported') <> 'verified' THEN
    RAISE EXCEPTION 'verified evidence is required';
  END IF;
  v_source := btrim(COALESCE(p_evidence->>'source','ron'));
  IF v_source = '' OR length(v_source) > 80 THEN
    RAISE EXCEPTION 'evidence.source is invalid';
  END IF;
  v_ref := NULLIF(btrim(COALESCE(p_evidence->>'ref','')), '');
  IF v_ref IS NOT NULL AND length(v_ref) > 500 THEN
    RAISE EXCEPTION 'evidence.ref is too long';
  END IF;
  IF p_require_ref AND v_ref IS NULL THEN
    RAISE EXCEPTION 'evidence.ref is required for calibration';
  END IF;
  RETURN jsonb_build_object('status','verified','source',v_source,'ref',v_ref);
END;
$$;

CREATE OR REPLACE FUNCTION system_validate_event_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
  v_basis system_events%ROWTYPE;
  v_evidence jsonb;
  v_item_id text;
  v_item_payload jsonb;
  v_cost bigint;
  v_coin_balance bigint;
  v_economy_status text;
  v_notification_id text;
BEGIN
  IF NEW.event_type NOT IN (
    'quest.created','quest.completed','quest.cancelled','progression.awarded',
    'profile.calibrated','attribute.set','skill.upserted','achievement.unlocked',
    'shop.item.upserted','shop.redeemed','notification.pushed','notification.acknowledged'
  ) THEN
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
    v_evidence := system_normalize_verified_evidence(NEW.payload->'evidence', false);
    IF COALESCE(NEW.payload->>'xp','') !~ '^[0-9]+$' OR COALESCE(NEW.payload->>'coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'xp and coins must be non-negative integers'; END IF;
    IF (NEW.payload->>'xp')::numeric = 0 AND (NEW.payload->>'coins')::numeric = 0 THEN RAISE EXCEPTION 'progression.award requires xp or coins'; END IF;
    IF btrim(COALESCE(NEW.payload->>'basis_event_id',''))='' OR length(NEW.payload->>'basis_event_id')>100 THEN RAISE EXCEPTION 'basis_event_id is required'; END IF;
    SELECT * INTO v_basis FROM system_events e WHERE e.event_id::text = NEW.payload->>'basis_event_id';
    IF NOT FOUND THEN RAISE EXCEPTION 'basis_event_id does not exist'; END IF;
    IF v_basis.event_type <> 'quest.completed' THEN RAISE EXCEPTION 'progression basis must be a quest.completed event'; END IF;
    IF v_basis.claim_status <> 'verified' THEN RAISE EXCEPTION 'progression basis must be verified'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='progression.awarded' AND e.payload->>'basis_event_id'=v_basis.event_id::text) THEN RAISE EXCEPTION 'progression already awarded for basis event'; END IF;

  ELSIF NEW.event_type='profile.calibrated' THEN
    IF NEW.claim_status <> 'verified' THEN RAISE EXCEPTION 'profile.calibrated must be verified'; END IF;
    v_evidence := system_normalize_verified_evidence(NEW.payload->'evidence', true);
    IF NOT (NEW.payload ?| ARRAY['level','rank','xp_to_next','economy_status']) THEN RAISE EXCEPTION 'profile.calibrate requires at least one calibration field'; END IF;
    IF NEW.payload ? 'level' AND jsonb_typeof(NEW.payload->'level') <> 'null' THEN
      IF COALESCE(NEW.payload->>'level','') !~ '^[0-9]+$' OR (NEW.payload->>'level')::numeric < 1 OR (NEW.payload->>'level')::numeric > 9999 THEN RAISE EXCEPTION 'level is invalid'; END IF;
    END IF;
    IF NEW.payload ? 'rank' AND jsonb_typeof(NEW.payload->'rank') <> 'null' AND COALESCE(NEW.payload->>'rank','') NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'rank is invalid'; END IF;
    IF NEW.payload ? 'xp_to_next' AND jsonb_typeof(NEW.payload->'xp_to_next') <> 'null' THEN
      IF COALESCE(NEW.payload->>'xp_to_next','') !~ '^[0-9]+$' OR (NEW.payload->>'xp_to_next')::numeric < 1 THEN RAISE EXCEPTION 'xp_to_next is invalid'; END IF;
    END IF;
    IF NEW.payload ? 'economy_status' AND COALESCE(NEW.payload->>'economy_status','') NOT IN ('UNCALIBRATED','CALIBRATED') THEN RAISE EXCEPTION 'economy_status is invalid'; END IF;

  ELSIF NEW.event_type='attribute.set' THEN
    IF NEW.claim_status <> 'verified' THEN RAISE EXCEPTION 'attribute.set must be verified'; END IF;
    v_evidence := system_normalize_verified_evidence(NEW.payload->'evidence', true);
    IF COALESCE(NEW.payload->>'name','') NOT IN ('STR','VIT','INT','DISC','CHA') THEN RAISE EXCEPTION 'attribute name is invalid'; END IF;
    IF jsonb_typeof(NEW.payload->'value') <> 'null' THEN
      IF COALESCE(NEW.payload->>'value','') !~ '^[0-9]+$' OR (NEW.payload->>'value')::numeric > 9999 THEN RAISE EXCEPTION 'attribute value is invalid'; END IF;
    END IF;
    IF btrim(COALESCE(NEW.payload->>'scale_ref',''))='' OR length(NEW.payload->>'scale_ref')>160 THEN RAISE EXCEPTION 'scale_ref is required'; END IF;

  ELSIF NEW.event_type='skill.upserted' THEN
    IF NEW.claim_status <> 'verified' THEN RAISE EXCEPTION 'skill.upserted must be verified'; END IF;
    v_evidence := system_normalize_verified_evidence(NEW.payload->'evidence', true);
    IF btrim(COALESCE(NEW.payload->>'skill_id',''))='' OR length(NEW.payload->>'skill_id')>100 THEN RAISE EXCEPTION 'skill_id is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'name',''))='' OR length(NEW.payload->>'name')>160 THEN RAISE EXCEPTION 'skill name is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'domain',''))='' OR length(NEW.payload->>'domain')>120 THEN RAISE EXCEPTION 'skill domain is invalid'; END IF;
    IF jsonb_typeof(NEW.payload->'active') <> 'boolean' THEN RAISE EXCEPTION 'skill active must be boolean'; END IF;
    IF jsonb_typeof(NEW.payload->'level') <> 'null' THEN
      IF COALESCE(NEW.payload->>'level','') !~ '^[0-9]+$' OR (NEW.payload->>'level')::numeric > 9999 THEN RAISE EXCEPTION 'skill level is invalid'; END IF;
      IF btrim(COALESCE(NEW.payload->>'scale_ref',''))='' OR length(NEW.payload->>'scale_ref')>160 THEN RAISE EXCEPTION 'scale_ref is required when skill level is set'; END IF;
    ELSIF NEW.payload->>'scale_ref' IS NOT NULL AND length(NEW.payload->>'scale_ref')>160 THEN
      RAISE EXCEPTION 'skill scale_ref is too long';
    END IF;

  ELSIF NEW.event_type='achievement.unlocked' THEN
    IF NEW.claim_status <> 'verified' THEN RAISE EXCEPTION 'achievement.unlocked must be verified'; END IF;
    v_evidence := system_normalize_verified_evidence(NEW.payload->'evidence', true);
    IF btrim(COALESCE(NEW.payload->>'achievement_id',''))='' OR length(NEW.payload->>'achievement_id')>100 THEN RAISE EXCEPTION 'achievement_id is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'title',''))='' OR length(NEW.payload->>'title')>180 THEN RAISE EXCEPTION 'achievement title is invalid'; END IF;
    IF length(COALESCE(NEW.payload->>'description',''))>1200 THEN RAISE EXCEPTION 'achievement description is too long'; END IF;
    IF COALESCE(NEW.payload->>'rank','') NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'achievement rank is invalid'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='achievement.unlocked' AND e.payload->>'achievement_id'=NEW.payload->>'achievement_id') THEN RAISE EXCEPTION 'achievement already unlocked'; END IF;

  ELSIF NEW.event_type='shop.item.upserted' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'shop.item.upserted must be derived'; END IF;
    IF btrim(COALESCE(NEW.payload->>'item_id',''))='' OR length(NEW.payload->>'item_id')>100 THEN RAISE EXCEPTION 'item_id is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'title',''))='' OR length(NEW.payload->>'title')>180 THEN RAISE EXCEPTION 'shop title is invalid'; END IF;
    IF length(COALESCE(NEW.payload->>'description',''))>1200 THEN RAISE EXCEPTION 'shop description is too long'; END IF;
    IF jsonb_typeof(NEW.payload->'active') <> 'boolean' OR jsonb_typeof(NEW.payload->'repeatable') <> 'boolean' THEN RAISE EXCEPTION 'shop active/repeatable must be boolean'; END IF;
    IF jsonb_typeof(NEW.payload->'cost_coins') <> 'null' AND COALESCE(NEW.payload->>'cost_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'cost_coins must be a non-negative integer or null'; END IF;

  ELSIF NEW.event_type='shop.redeemed' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'shop.redeemed must be derived'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended('system-economy', 0));
    v_item_id := btrim(COALESCE(NEW.payload->>'item_id',''));
    IF v_item_id='' OR length(v_item_id)>100 THEN RAISE EXCEPTION 'item_id is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'redemption_id',''))='' OR length(NEW.payload->>'redemption_id')>100 THEN RAISE EXCEPTION 'redemption_id is invalid'; END IF;
    IF length(COALESCE(NEW.payload->>'note',''))>500 THEN RAISE EXCEPTION 'redemption note is too long'; END IF;
    SELECT e.payload INTO v_item_payload FROM system_events e WHERE e.event_type='shop.item.upserted' AND e.payload->>'item_id'=v_item_id ORDER BY e.seq DESC LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'shop item does not exist'; END IF;
    IF COALESCE((v_item_payload->>'active')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'shop item is inactive'; END IF;
    IF jsonb_typeof(v_item_payload->'cost_coins')='null' OR v_item_payload->>'cost_coins' IS NULL THEN RAISE EXCEPTION 'shop item cost is uncalibrated'; END IF;
    v_cost := (v_item_payload->>'cost_coins')::bigint;
    IF COALESCE(NEW.payload->>'cost_coins','') !~ '^[0-9]+$' OR (NEW.payload->>'cost_coins')::bigint <> v_cost THEN RAISE EXCEPTION 'redemption cost does not match current shop item'; END IF;
    SELECT e.payload->>'economy_status' INTO v_economy_status FROM system_events e WHERE e.event_type='profile.calibrated' AND e.payload ? 'economy_status' ORDER BY e.seq DESC LIMIT 1;
    IF COALESCE(v_economy_status,'UNCALIBRATED') <> 'CALIBRATED' THEN RAISE EXCEPTION 'economy is uncalibrated'; END IF;
    IF COALESCE((v_item_payload->>'repeatable')::boolean,false) IS NOT TRUE AND EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='shop.redeemed' AND e.payload->>'item_id'=v_item_id) THEN RAISE EXCEPTION 'shop item is not repeatable'; END IF;
    SELECT COALESCE(SUM(CASE WHEN e.event_type='progression.awarded' THEN (e.payload->>'coins')::bigint WHEN e.event_type='shop.redeemed' THEN -(e.payload->>'cost_coins')::bigint ELSE 0 END),0) INTO v_coin_balance FROM system_events e WHERE e.event_type IN ('progression.awarded','shop.redeemed');
    IF v_coin_balance < v_cost THEN RAISE EXCEPTION 'insufficient coins'; END IF;

  ELSIF NEW.event_type='notification.pushed' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'notification.pushed must be derived'; END IF;
    v_notification_id := btrim(COALESCE(NEW.payload->>'notification_id',''));
    IF v_notification_id='' OR length(v_notification_id)>100 THEN RAISE EXCEPTION 'notification_id is invalid'; END IF;
    IF btrim(COALESCE(NEW.payload->>'title',''))='' OR length(NEW.payload->>'title')>180 THEN RAISE EXCEPTION 'notification title is invalid'; END IF;
    IF length(COALESCE(NEW.payload->>'body',''))>1200 THEN RAISE EXCEPTION 'notification body is too long'; END IF;
    IF COALESCE(NEW.payload->>'severity','') NOT IN ('INFO','SUCCESS','WARNING','CRITICAL') THEN RAISE EXCEPTION 'notification severity is invalid'; END IF;
    IF COALESCE(NEW.payload->>'kind','') NOT IN ('SYSTEM','QUEST','REWARD','ACHIEVEMENT') THEN RAISE EXCEPTION 'notification kind is invalid'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='notification.pushed' AND e.payload->>'notification_id'=v_notification_id) THEN RAISE EXCEPTION 'notification_id already exists'; END IF;

  ELSIF NEW.event_type='notification.acknowledged' THEN
    IF NEW.claim_status <> 'derived' THEN RAISE EXCEPTION 'notification.acknowledged must be derived'; END IF;
    v_notification_id := btrim(COALESCE(NEW.payload->>'notification_id',''));
    IF v_notification_id='' OR length(v_notification_id)>100 THEN RAISE EXCEPTION 'notification_id is invalid'; END IF;
    IF NOT EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='notification.pushed' AND e.payload->>'notification_id'=v_notification_id) THEN RAISE EXCEPTION 'notification does not exist'; END IF;
    IF EXISTS (SELECT 1 FROM system_events e WHERE e.event_type='notification.acknowledged' AND e.payload->>'notification_id'=v_notification_id) THEN RAISE EXCEPTION 'notification is already acknowledged'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
  v_level bigint;
  v_xp_to_next bigint;
  v_economy_status text;
  v_attr_name text;
  v_value bigint;
  v_scale_ref text;
  v_skill_id text;
  v_domain text;
  v_active boolean;
  v_achievement_id text;
  v_item_id text;
  v_repeatable boolean;
  v_item_payload jsonb;
  v_cost bigint;
  v_redemption_id text;
  v_notification_id text;
  v_severity text;
  v_kind text;
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
  IF p_request_hash IS NOT NULL AND (btrim(p_request_hash)='' OR length(p_request_hash)>128) THEN RAISE EXCEPTION 'request_hash is invalid'; END IF;

  v_request_hash := COALESCE(p_request_hash, 'db:' || md5(jsonb_build_object('action',p_action,'context',jsonb_build_object('actor',p_actor,'source',p_source,'sourceRef',p_source_ref))::text));
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
      ELSE v_reward_xp := NULL; END IF;
      IF v_payload ? 'reward_coins' AND jsonb_typeof(v_payload->'reward_coins') <> 'null' THEN
        IF COALESCE(v_payload->>'reward_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.reward_coins must be a non-negative integer or null'; END IF;
        v_reward_coins := (v_payload->>'reward_coins')::bigint;
      ELSE v_reward_coins := NULL; END IF;
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
      v_evidence := system_normalize_verified_evidence(v_payload->'evidence', false);
      IF COALESCE(v_payload->>'xp','0') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.xp must be a non-negative integer'; END IF;
      IF COALESCE(v_payload->>'coins','0') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.coins must be a non-negative integer'; END IF;
      v_xp := COALESCE((v_payload->>'xp')::bigint,0);
      v_coins := COALESCE((v_payload->>'coins')::bigint,0);
      IF v_xp=0 AND v_coins=0 THEN RAISE EXCEPTION 'progression.award requires xp or coins'; END IF;
      v_basis_event_id := btrim(COALESCE(v_payload->>'basis_event_id',''));
      IF v_basis_event_id='' OR length(v_basis_event_id)>100 THEN RAISE EXCEPTION 'payload.basis_event_id is required'; END IF;
      v_event_payload := jsonb_build_object('xp',v_xp,'coins',v_coins,'basis_event_id',v_basis_event_id,'evidence',v_evidence);
      v_claim_status := 'verified';

    WHEN 'profile.calibrate' THEN
      v_event_type := 'profile.calibrated';
      v_evidence := system_normalize_verified_evidence(v_payload->'evidence', true);
      IF NOT (v_payload ?| ARRAY['level','rank','xp_to_next','economy_status']) THEN RAISE EXCEPTION 'profile.calibrate requires at least one calibration field'; END IF;
      v_event_payload := jsonb_build_object('evidence',v_evidence);
      IF v_payload ? 'level' THEN
        IF jsonb_typeof(v_payload->'level')='null' THEN v_event_payload := v_event_payload || jsonb_build_object('level',NULL);
        ELSE
          IF COALESCE(v_payload->>'level','') !~ '^[0-9]+$' OR (v_payload->>'level')::numeric<1 OR (v_payload->>'level')::numeric>9999 THEN RAISE EXCEPTION 'payload.level is invalid'; END IF;
          v_level := (v_payload->>'level')::bigint;
          v_event_payload := v_event_payload || jsonb_build_object('level',v_level);
        END IF;
      END IF;
      IF v_payload ? 'rank' THEN
        IF jsonb_typeof(v_payload->'rank')='null' THEN v_event_payload := v_event_payload || jsonb_build_object('rank',NULL);
        ELSE
          v_rank := v_payload->>'rank'; IF v_rank NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'payload.rank is invalid'; END IF;
          v_event_payload := v_event_payload || jsonb_build_object('rank',v_rank);
        END IF;
      END IF;
      IF v_payload ? 'xp_to_next' THEN
        IF jsonb_typeof(v_payload->'xp_to_next')='null' THEN v_event_payload := v_event_payload || jsonb_build_object('xp_to_next',NULL);
        ELSE
          IF COALESCE(v_payload->>'xp_to_next','') !~ '^[0-9]+$' OR (v_payload->>'xp_to_next')::numeric<1 THEN RAISE EXCEPTION 'payload.xp_to_next is invalid'; END IF;
          v_xp_to_next := (v_payload->>'xp_to_next')::bigint;
          v_event_payload := v_event_payload || jsonb_build_object('xp_to_next',v_xp_to_next);
        END IF;
      END IF;
      IF v_payload ? 'economy_status' THEN
        v_economy_status := v_payload->>'economy_status'; IF v_economy_status NOT IN ('UNCALIBRATED','CALIBRATED') THEN RAISE EXCEPTION 'payload.economy_status is invalid'; END IF;
        v_event_payload := v_event_payload || jsonb_build_object('economy_status',v_economy_status);
      END IF;
      v_claim_status := 'verified';

    WHEN 'attribute.set' THEN
      v_event_type := 'attribute.set';
      v_evidence := system_normalize_verified_evidence(v_payload->'evidence', true);
      v_attr_name := v_payload->>'name'; IF v_attr_name NOT IN ('STR','VIT','INT','DISC','CHA') THEN RAISE EXCEPTION 'payload.name is invalid'; END IF;
      IF NOT (v_payload ? 'value') THEN RAISE EXCEPTION 'payload.value is required'; END IF;
      IF jsonb_typeof(v_payload->'value')='null' THEN v_value := NULL;
      ELSE
        IF COALESCE(v_payload->>'value','') !~ '^[0-9]+$' OR (v_payload->>'value')::numeric>9999 THEN RAISE EXCEPTION 'payload.value is invalid'; END IF;
        v_value := (v_payload->>'value')::bigint;
      END IF;
      v_scale_ref := btrim(COALESCE(v_payload->>'scale_ref','')); IF v_scale_ref='' OR length(v_scale_ref)>160 THEN RAISE EXCEPTION 'payload.scale_ref is required'; END IF;
      v_event_payload := jsonb_build_object('name',v_attr_name,'value',v_value,'scale_ref',v_scale_ref,'evidence',v_evidence);
      v_claim_status := 'verified';

    WHEN 'skill.upsert' THEN
      v_event_type := 'skill.upserted';
      v_evidence := system_normalize_verified_evidence(v_payload->'evidence', true);
      v_skill_id := btrim(COALESCE(v_payload->>'skill_id',gen_random_uuid()::text)); IF v_skill_id='' OR length(v_skill_id)>100 THEN RAISE EXCEPTION 'payload.skill_id is invalid'; END IF;
      v_title := btrim(COALESCE(v_payload->>'name','')); IF v_title='' OR length(v_title)>160 THEN RAISE EXCEPTION 'payload.name is invalid'; END IF;
      v_domain := btrim(COALESCE(v_payload->>'domain','')); IF v_domain='' OR length(v_domain)>120 THEN RAISE EXCEPTION 'payload.domain is invalid'; END IF;
      IF v_payload ? 'level' AND jsonb_typeof(v_payload->'level') <> 'null' THEN
        IF COALESCE(v_payload->>'level','') !~ '^[0-9]+$' OR (v_payload->>'level')::numeric>9999 THEN RAISE EXCEPTION 'payload.level is invalid'; END IF;
        v_level := (v_payload->>'level')::bigint;
      ELSE v_level := NULL; END IF;
      v_scale_ref := NULLIF(btrim(COALESCE(v_payload->>'scale_ref','')),'');
      IF v_level IS NOT NULL AND v_scale_ref IS NULL THEN RAISE EXCEPTION 'payload.scale_ref is required when skill level is set'; END IF;
      IF v_scale_ref IS NOT NULL AND length(v_scale_ref)>160 THEN RAISE EXCEPTION 'payload.scale_ref is too long'; END IF;
      IF v_payload ? 'active' THEN IF jsonb_typeof(v_payload->'active')<>'boolean' THEN RAISE EXCEPTION 'payload.active must be boolean'; END IF; v_active := (v_payload->>'active')::boolean; ELSE v_active := true; END IF;
      v_event_payload := jsonb_build_object('skill_id',v_skill_id,'name',v_title,'domain',v_domain,'level',v_level,'scale_ref',v_scale_ref,'active',v_active,'evidence',v_evidence);
      v_claim_status := 'verified';

    WHEN 'achievement.unlock' THEN
      v_event_type := 'achievement.unlocked';
      v_evidence := system_normalize_verified_evidence(v_payload->'evidence', true);
      v_achievement_id := btrim(COALESCE(v_payload->>'achievement_id',gen_random_uuid()::text)); IF v_achievement_id='' OR length(v_achievement_id)>100 THEN RAISE EXCEPTION 'payload.achievement_id is invalid'; END IF;
      v_title := btrim(COALESCE(v_payload->>'title','')); IF v_title='' OR length(v_title)>180 THEN RAISE EXCEPTION 'payload.title is invalid'; END IF;
      v_description := left(btrim(COALESCE(v_payload->>'description','')),1200);
      v_rank := COALESCE(v_payload->>'rank','E'); IF v_rank NOT IN ('E','D','C','B','A','S') THEN RAISE EXCEPTION 'payload.rank is invalid'; END IF;
      v_event_payload := jsonb_build_object('achievement_id',v_achievement_id,'title',v_title,'description',v_description,'rank',v_rank,'evidence',v_evidence);
      v_claim_status := 'verified';

    WHEN 'shop.item.upsert' THEN
      v_event_type := 'shop.item.upserted';
      v_item_id := btrim(COALESCE(v_payload->>'item_id',gen_random_uuid()::text)); IF v_item_id='' OR length(v_item_id)>100 THEN RAISE EXCEPTION 'payload.item_id is invalid'; END IF;
      v_title := btrim(COALESCE(v_payload->>'title','')); IF v_title='' OR length(v_title)>180 THEN RAISE EXCEPTION 'payload.title is invalid'; END IF;
      v_description := left(btrim(COALESCE(v_payload->>'description','')),1200);
      IF NOT (v_payload ? 'cost_coins') OR jsonb_typeof(v_payload->'cost_coins')='null' THEN v_cost := NULL;
      ELSE IF COALESCE(v_payload->>'cost_coins','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'payload.cost_coins is invalid'; END IF; v_cost := (v_payload->>'cost_coins')::bigint; END IF;
      IF v_payload ? 'active' THEN IF jsonb_typeof(v_payload->'active')<>'boolean' THEN RAISE EXCEPTION 'payload.active must be boolean'; END IF; v_active := (v_payload->>'active')::boolean; ELSE v_active := true; END IF;
      IF v_payload ? 'repeatable' THEN IF jsonb_typeof(v_payload->'repeatable')<>'boolean' THEN RAISE EXCEPTION 'payload.repeatable must be boolean'; END IF; v_repeatable := (v_payload->>'repeatable')::boolean; ELSE v_repeatable := false; END IF;
      v_event_payload := jsonb_build_object('item_id',v_item_id,'title',v_title,'description',v_description,'cost_coins',v_cost,'active',v_active,'repeatable',v_repeatable);
      v_claim_status := 'derived';

    WHEN 'shop.redeem' THEN
      v_event_type := 'shop.redeemed';
      v_item_id := btrim(COALESCE(v_payload->>'item_id','')); IF v_item_id='' OR length(v_item_id)>100 THEN RAISE EXCEPTION 'payload.item_id is required'; END IF;
      v_redemption_id := btrim(COALESCE(v_payload->>'redemption_id',gen_random_uuid()::text)); IF v_redemption_id='' OR length(v_redemption_id)>100 THEN RAISE EXCEPTION 'payload.redemption_id is invalid'; END IF;
      v_reason := left(btrim(COALESCE(v_payload->>'note','')),500);
      SELECT e.payload INTO v_item_payload FROM system_events e WHERE e.event_type='shop.item.upserted' AND e.payload->>'item_id'=v_item_id ORDER BY e.seq DESC LIMIT 1;
      IF NOT FOUND THEN RAISE EXCEPTION 'shop item does not exist'; END IF;
      IF jsonb_typeof(v_item_payload->'cost_coins')='null' OR v_item_payload->>'cost_coins' IS NULL THEN RAISE EXCEPTION 'shop item cost is uncalibrated'; END IF;
      v_cost := (v_item_payload->>'cost_coins')::bigint;
      v_event_payload := jsonb_build_object('item_id',v_item_id,'redemption_id',v_redemption_id,'note',v_reason,'cost_coins',v_cost,'item_title',v_item_payload->>'title');
      v_claim_status := 'derived';

    WHEN 'notification.push' THEN
      v_event_type := 'notification.pushed';
      v_notification_id := btrim(COALESCE(v_payload->>'notification_id',gen_random_uuid()::text)); IF v_notification_id='' OR length(v_notification_id)>100 THEN RAISE EXCEPTION 'payload.notification_id is invalid'; END IF;
      v_title := btrim(COALESCE(v_payload->>'title','')); IF v_title='' OR length(v_title)>180 THEN RAISE EXCEPTION 'payload.title is invalid'; END IF;
      v_description := left(btrim(COALESCE(v_payload->>'body','')),1200);
      v_severity := COALESCE(v_payload->>'severity','INFO'); IF v_severity NOT IN ('INFO','SUCCESS','WARNING','CRITICAL') THEN RAISE EXCEPTION 'payload.severity is invalid'; END IF;
      v_kind := COALESCE(v_payload->>'kind','SYSTEM'); IF v_kind NOT IN ('SYSTEM','QUEST','REWARD','ACHIEVEMENT') THEN RAISE EXCEPTION 'payload.kind is invalid'; END IF;
      v_event_payload := jsonb_build_object('notification_id',v_notification_id,'title',v_title,'body',v_description,'severity',v_severity,'kind',v_kind);
      v_claim_status := 'derived';

    WHEN 'notification.ack' THEN
      v_event_type := 'notification.acknowledged';
      v_notification_id := btrim(COALESCE(v_payload->>'notification_id','')); IF v_notification_id='' OR length(v_notification_id)>100 THEN RAISE EXCEPTION 'payload.notification_id is required'; END IF;
      v_event_payload := jsonb_build_object('notification_id',v_notification_id);
      v_claim_status := 'derived';

    ELSE
      RAISE EXCEPTION 'unsupported action type: %', v_type;
  END CASE;

  INSERT INTO system_events(event_id,event_type,actor,source,source_ref,claim_status,idempotency_key,request_hash,payload)
  VALUES(gen_random_uuid(),v_event_type,p_actor,p_source,p_source_ref,v_claim_status,p_idempotency_key,v_request_hash,v_event_payload)
  RETURNING * INTO v_inserted;

  RETURN QUERY SELECT false, to_jsonb(v_inserted);
END;
$$;
