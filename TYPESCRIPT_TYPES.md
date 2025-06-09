# TypeScript Type Generation Guide

This project uses manual TypeScript types in `lib/supabase.ts` for development. For production, you should generate types directly from your Supabase database schema.

## Generating Types

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Generate Types**
   ```bash
   # Replace YOUR_PROJECT_ID with your actual Supabase project ID
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
   ```

4. **Update lib/supabase.ts**
   Replace the manual types with the generated ones:
   
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from './database.types'
   
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
   
   // Export convenience types
   export type Event = Database['public']['Tables']['events']['Row']
   export type Signup = Database['public']['Tables']['signups']['Row']
   ```

## Benefits of Generated Types

- **Always in sync** with your database schema
- **Complete type safety** including all columns, views, and functions
- **Better IntelliSense** support in your IDE
- **Catches schema mismatches** at compile time

## When to Regenerate

Regenerate types whenever you:
- Add or modify tables
- Change column types
- Add new views or functions
- Update RLS policies that affect accessible data 