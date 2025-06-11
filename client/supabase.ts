import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nugqfaokqrotfakpjqnk.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

console.log(supabase, 'supabase')