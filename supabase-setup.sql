CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  creatorId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creatorId TEXT;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert rooms" ON rooms;
CREATE POLICY "Anyone can insert rooms" ON rooms
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS rooms_id_idx ON rooms(id);

CREATE INDEX IF NOT EXISTS rooms_created_at_idx ON rooms(created_at);

