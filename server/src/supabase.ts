const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Changed this!

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error("Missing Supabase environment variables.");
}

// Use service role key for server-side operations
exports.supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
