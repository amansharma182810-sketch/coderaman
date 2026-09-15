CREATE TABLE IF NOT EXISTS queue_entries (
  id BIGSERIAL PRIMARY KEY,
  token_number INTEGER NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_status_token ON queue_entries(status, token_number);
