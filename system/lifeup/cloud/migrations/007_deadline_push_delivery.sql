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
