const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts"); // adjust path if needed

exports.fetchPractices = expressAsyncHandler(async (req, res, next) => {
	console.log("fetch practices runs");
	const { data, error } = await supabase.from("Practice").select("*");

	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}

	//   console.log('Data from Supabase:', data);
	res.status(200).json(data);
});
