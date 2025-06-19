import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants';

const supabaseUrl = "https://nugqfaokqrotfakpjqnk.supabase.co"
const supabaseKey = Constants.expoConfig?.extra?.SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
