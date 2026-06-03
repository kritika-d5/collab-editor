CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(12)  NOT NULL UNIQUE,
  owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language    VARCHAR(32)  NOT NULL DEFAULT 'javascript',
  doc_state   BYTEA,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operations (
  id          BIGSERIAL    PRIMARY KEY,
  session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq         INTEGER      NOT NULL,
  payload     BYTEA        NOT NULL,
  user_id     UUID         NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operations_session ON operations(session_id, seq);
