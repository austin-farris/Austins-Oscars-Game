-- Drop old tables first
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS odds CASCADE;

-- Players table
CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  picks JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table with winners column
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  winners JSONB DEFAULT '{}',
  odds_locked BOOLEAN DEFAULT FALSE
);

-- Initialize settings
INSERT INTO settings (id, winners, odds_locked) VALUES (1, '{}', false);

-- Odds table
CREATE TABLE odds (
  nominee_id TEXT PRIMARY KEY,
  odds DECIMAL(5,4) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all odds" ON odds FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
ALTER PUBLICATION supabase_realtime ADD TABLE odds;