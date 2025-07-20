const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts"); // adjust path if needed

exports.fetchPractices = expressAsyncHandler(async (req, res, next) => {
	const { data, error } = await supabase.from("Practice").select("*");
	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}

	//   console.log('Data from Supabase:', data);
	res.status(200).json(data);
});
exports.deletePractice = expressAsyncHandler(async (req, res, next) => {
	const { id } = req.params;

	const { data, error } = await supabase
		.from("Practice")
		.delete()
		.eq("id", id);

	if (error) {
		console.error("Supabase error:", error);
		// Let expressAsyncHandler catch it and forward to error middleware
		throw new Error(error.message);
	}

	res.status(200).json({ message: "Practice deleted", data });
});
