import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing REACT_APP_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file in the root of your React app.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing REACT_APP_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env.local file in the root of your React app.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 