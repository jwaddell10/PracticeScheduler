const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY; // Use anon key, not service role, for user-authenticated calls

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

const createSupabaseClientWithAuth = (token) =>
	createClient(supabaseUrl, supabaseAnonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

module.exports = { supabase, createSupabaseClientWithAuth };
