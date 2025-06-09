-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL CHECK (LENGTH(public_id) >= 4 AND LENGTH(public_id) <= 12),
  title TEXT NOT NULL CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 200),
  date TIMESTAMPTZ NOT NULL,
  max_signups INTEGER NOT NULL DEFAULT 10 CHECK (max_signups >= 1 AND max_signups <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create signups table
CREATE TABLE IF NOT EXISTS signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_signups_event_id ON signups(event_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_public_id ON events(public_id);
CREATE INDEX idx_events_date ON events(date);

-- Create unique index for case-insensitive name uniqueness per event
CREATE UNIQUE INDEX idx_signups_unique_name_per_event 
ON signups(event_id, LOWER(TRIM(name)));

-- Create a view to get events with their signups
CREATE OR REPLACE VIEW event_with_signups AS
SELECT 
  e.*,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', s.id,
        'event_id', s.event_id,
        'name', s.name,
        'timestamp', s.timestamp
      ) ORDER BY s.timestamp
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) AS signups
FROM events e
LEFT JOIN signups s ON e.id = s.event_id
GROUP BY e.id;

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;

-- Create policies (open for demo - no auth)
CREATE POLICY "Enable all operations for events" ON events
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for signups" ON signups
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enable realtime for both tables
-- Note: This might fail if the publication doesn't exist yet, but that's ok
DO $$
BEGIN
  -- Try to add tables to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  EXCEPTION 
    WHEN duplicate_object THEN NULL; -- Ignore if already added
    WHEN undefined_object THEN NULL; -- Ignore if publication doesn't exist
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE signups;
  EXCEPTION 
    WHEN duplicate_object THEN NULL; -- Ignore if already added
    WHEN undefined_object THEN NULL; -- Ignore if publication doesn't exist
  END;
END $$; 