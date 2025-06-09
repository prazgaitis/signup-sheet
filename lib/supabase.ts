import { createClient } from '@supabase/supabase-js'

// ⚠️ IMPORTANT: These are manually defined types for development only!
// For production, generate proper types using Supabase CLI:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
// See TYPESCRIPT_TYPES.md for detailed instructions

import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) 