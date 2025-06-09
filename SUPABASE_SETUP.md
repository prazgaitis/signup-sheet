# Supabase Setup Instructions

This app now uses Supabase for data storage and real-time updates instead of Upstash Redis with SSE.

## Setup Steps

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be provisioned

2. **Run Database Migrations**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/00001_create_events_and_signups.sql`
   - Run the SQL to create the tables, indexes, and enable realtime

3. **Get Your API Keys**
   - Go to Settings → API in your Supabase dashboard
   - Copy the Project URL and anon/public key

4. **Configure Environment Variables**
   - Copy `env.example` to `.env.local`
   - Replace the placeholder values with your actual Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

5. **Generate TypeScript Types (Recommended)**
   - Install Supabase CLI: `npm install -g supabase`
   - Login to Supabase: `supabase login`
   - Generate types: `supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts`
   - Update `lib/supabase.ts` to use the generated types instead of the manual ones

6. **Verify Realtime is Enabled**
   - Go to Database → Replication in your Supabase dashboard
   - Ensure that the `events` and `signups` tables are listed under "Source"
   - If not, you can enable them manually or re-run the migration

## Features

- **Real-time Updates**: Changes to events and signups are automatically synchronized across all connected clients
- **No Authentication**: The app is configured without authentication for demo purposes
- **Row Level Security**: Basic RLS policies are in place allowing all operations for anonymous users
- **UUID Primary Keys**: Events use proper UUIDs as primary keys for better database practices
- **Public IDs**: Short, user-friendly IDs for sharing event URLs

## Database Schema

- **events**: Stores event information
  - `id` (UUID): Primary key
  - `public_id` (TEXT): Short, unique ID for URLs
  - `title` (TEXT): Event title
  - `date` (TIMESTAMPTZ): Event date/time
  - `max_signups` (INTEGER): Maximum number of attendees
  - `created_at` (TIMESTAMPTZ): When the event was created

- **signups**: Stores signup information
  - `id` (UUID): Primary key
  - `event_id` (UUID): Foreign key to events
  - `name` (TEXT): Attendee name
  - `timestamp` (TIMESTAMPTZ): When they signed up

- **event_with_signups**: View that joins events with their signups

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variables in Vercel's project settings
4. Deploy!

The app will automatically use Supabase Realtime for live updates, which works perfectly with Vercel's serverless architecture. 