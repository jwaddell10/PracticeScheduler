import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nugqfaokqrotfakpjqnk.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3FmYW9rcXJvdGZha3BqcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjkyNzIsImV4cCI6MjA2NTI0NTI3Mn0.XpxzQvNkRttNdHN9qLblfi67hmdZ-IR5Igs4G0A2nG0";
const supabaseServiceRole =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3FmYW9rcXJvdGZha3BqcW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY2OTI3MiwiZXhwIjoyMDY1MjQ1MjcyfQ.BEu5lh9EBPIN7EbAYsvz-ntUBpfTu20y2qNt2bklLnM";
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
