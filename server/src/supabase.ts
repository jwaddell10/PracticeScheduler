import { createClient } from '@supabase/supabase-js'
// import Constants from 'expo-constants';

const supabaseUrl = "https://nugqfaokqrotfakpjqnk.supabase.co"
const supabaseKey = process.env.EXPO_SUPABASE_NEW_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseKey)