# Migration Guide

If you already deployed the app with the previous schema (where events used text IDs), here's how to migrate:

## Option 1: Fresh Start (Recommended for Demo/Test)

If you don't have important data:

1. Drop existing tables:
   ```sql
   DROP TABLE IF EXISTS signups CASCADE;
   DROP TABLE IF EXISTS events CASCADE;
   DROP VIEW IF EXISTS event_with_signups;
   ```

2. Run the new migration from `supabase/migrations/00001_create_events_and_signups.sql`

## Option 2: Migrate Existing Data

If you need to preserve existing data:

```sql
-- 1. Add new columns to events table
ALTER TABLE events 
ADD COLUMN new_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN public_id TEXT;

-- 2. Set public_id to the old id values
UPDATE events SET public_id = id;

-- 3. Add new event_id column to signups
ALTER TABLE signups
ADD COLUMN new_event_id UUID;

-- 4. Update signups with the new UUID from events
UPDATE signups s
SET new_event_id = e.new_id
FROM events e
WHERE s.event_id = e.id;

-- 5. Drop old constraints
ALTER TABLE signups DROP CONSTRAINT signups_event_id_fkey;
ALTER TABLE signups DROP CONSTRAINT signups_event_id_name_key;

-- 6. Drop old columns
ALTER TABLE events DROP COLUMN id;
ALTER TABLE events RENAME COLUMN new_id TO id;
ALTER TABLE events ADD PRIMARY KEY (id);
ALTER TABLE events ADD CONSTRAINT events_public_id_key UNIQUE (public_id);

ALTER TABLE signups DROP COLUMN event_id;
ALTER TABLE signups RENAME COLUMN new_event_id TO event_id;

-- 7. Re-add constraints
ALTER TABLE signups 
ADD CONSTRAINT signups_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE signups
ADD CONSTRAINT signups_event_id_name_key 
UNIQUE(event_id, name);

-- 8. Add the new index
CREATE INDEX idx_events_public_id ON events(public_id);

-- 9. Recreate the view
DROP VIEW IF EXISTS event_with_signups;
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
```

## After Migration

1. Update your environment variables if needed
2. Regenerate TypeScript types (see TYPESCRIPT_TYPES.md)
3. Test the application thoroughly
4. Deploy the updated code 