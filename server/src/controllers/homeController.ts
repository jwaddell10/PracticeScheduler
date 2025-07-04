const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts"); // adjust path if needed

exports.fetchPractices = expressAsyncHandler(async (req, res, next) => {
	const { data, error } = await supabase.from("Practice").select("*");
	console.log(data, 'data from supabase')
	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}

	//   console.log('Data from Supabase:', data);
	res.status(200).json(data);
});
