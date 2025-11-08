CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert rooms" ON rooms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS rooms_id_idx ON rooms(id);

CREATE INDEX IF NOT EXISTS rooms_created_at_idx ON rooms(created_at);

