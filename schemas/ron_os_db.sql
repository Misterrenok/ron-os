-- Ron OS structured-state / analytics layer
-- ROLE: derived integration + analytics. Upstream live/domain owners remain authoritative.
-- Do not bulk-mirror apps. Store only data needed for cross-domain joins, history,
-- experiments, provenance, subjective ratings, price history, decisions, and derived metrics.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ron_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  name text NOT NULL,
  external_source text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (external_source, external_id)
);

CREATE TABLE IF NOT EXISTS ron_observations (
  id bigserial PRIMARY KEY,
  entity_id uuid REFERENCES ron_entities(id) ON DELETE CASCADE,
  domain text NOT NULL,
  metric text NOT NULL,
  value_num numeric,
  value_text text,
  unit text,
  source text NOT NULL,
  source_entity_id text,
  observed_at timestamptz NOT NULL,
  valid_from timestamptz,
  valid_to timestamptz,
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  model_version text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (value_num IS NOT NULL OR value_text IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ron_observations_metric_time
  ON ron_observations(domain, metric, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ron_observations_entity_time
  ON ron_observations(entity_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS ron_relationships (
  id bigserial PRIMARY KEY,
  source_entity_id uuid NOT NULL REFERENCES ron_entities(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES ron_entities(id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  source text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  valid_from timestamptz,
  valid_to timestamptz,
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (source_entity_id <> target_entity_id)
);

CREATE TABLE IF NOT EXISTS ron_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decided_at timestamptz NOT NULL DEFAULT now(),
  domain text NOT NULL,
  question text NOT NULL,
  chosen_action text NOT NULL,
  rationale text,
  expected_effect text,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','SUPERSEDED','REVIEW','REJECTED','COMPLETED')),
  reversibility text,
  review_at timestamptz,
  source text NOT NULL DEFAULT 'ron_os',
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ron_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL,
  hypothesis text,
  status text NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED','RUNNING','PAUSED','COMPLETED','ABORTED')),
  started_at timestamptz,
  ended_at timestamptz,
  decision_id uuid REFERENCES ron_decisions(id) ON DELETE SET NULL,
  primary_metric text,
  baseline_window tstzrange,
  intervention jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ron_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL,
  domain text NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL,
  source_entity_id text,
  entity_id uuid REFERENCES ron_entities(id) ON DELETE SET NULL,
  experiment_id uuid REFERENCES ron_experiments(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ron_events_time ON ron_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ron_events_domain_type ON ron_events(domain, event_type, occurred_at DESC);

COMMENT ON TABLE ron_observations IS
  'Derived/integration observations with provenance. A copied app value never overrides its upstream owner.';
COMMENT ON TABLE ron_decisions IS
  'Decision/event memory for Ron OS; rationale and expected effect are retained for later outcome review.';
COMMENT ON TABLE ron_experiments IS
  'Explicit baseline/intervention experiments; do not infer causal success from uncontrolled changes.';
