CREATE TABLE IF NOT EXISTS system_events (
  seq BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  source TEXT NOT NULL,
  source_ref TEXT,
  claim_status TEXT NOT NULL CHECK (claim_status IN ('none', 'reported', 'verified', 'derived')),
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS system_events_occurred_at_idx
  ON system_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS system_events_type_idx
  ON system_events (event_type, seq DESC);
