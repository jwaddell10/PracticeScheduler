const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts");

exports.fetchDrills = expressAsyncHandler(async (req, res) => {
	console.log('fetch drills runs')
	const { data, error } = await supabase.from("Drill").select("*");
		console.log(data, 'data')

	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}
	res.status(200).json(data);
});

exports.createDrill = expressAsyncHandler(async (req, res) => {
	console.log(req.body, 'req body create drills')
});
