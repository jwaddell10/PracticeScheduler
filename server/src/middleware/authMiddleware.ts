const { supabase } = require("../supabase.ts");

// // const { createClient } = require("@supabase/supabase-js");
// // const SUPABASE_URL = process.env.SUPABASE_URL;
// // const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// // const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
// // 	auth: {
// // 		autoRefreshToken: false,
// // 		persistSession: false,
// // 	},
// // });

// // middleware/authMiddleware.js


const authenticateUser = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Missing or malformed auth header" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const { data: { user }, error } = await supabase.auth.getUser(token);

		if (error || !user) {
			return res.status(401).json({ error: "Invalid or expired token" });
		}

		req.user = user;
		req.token = token;
		next();
	} catch (err) {
		console.error("Auth error:", err);
		return res.status(401).json({ error: "Authentication failed" });
	}
};

module.exports = authenticateUser;

