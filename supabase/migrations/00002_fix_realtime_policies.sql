-- Optional migration to fix realtime issues
-- Run this if realtime DELETE events are not working

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for events" ON events;
DROP POLICY IF EXISTS "Enable all operations for signups" ON signups;

-- Create more explicit policies that work better with realtime
CREATE POLICY "Enable read access for events" ON events
  FOR SELECT TO anon USING (true);

CREATE POLICY "Enable insert access for events" ON events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable update access for events" ON events
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for events" ON events
  FOR DELETE TO anon USING (true);

CREATE POLICY "Enable read access for signups" ON signups
  FOR SELECT TO anon USING (true);

CREATE POLICY "Enable insert access for signups" ON signups
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable update access for signups" ON signups
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for signups" ON signups
  FOR DELETE TO anon USING (true);

-- Verify realtime is enabled
DO $$
BEGIN
  -- Ensure tables are in realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE signups;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;
END $$; 