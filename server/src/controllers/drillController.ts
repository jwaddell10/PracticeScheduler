const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts");
const { createSupabaseClientWithAuth } = require("../supabase.ts");

exports.fetchDrills = expressAsyncHandler(async (req, res) => {
	const { data, error } = await supabase.from("Drill").select("*");
	console.log(data, 'data drills')
	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}
	res.status(200).json(data);
});

exports.createDrill = expressAsyncHandler(async (req, res) => {
	console.log(req.body, 'create drill runs')
	if (!req.user || !req.token) {
		return res
			.status(401)
			.json({ error: "Not authorized to create drills" });
	}
	const supabase = createSupabaseClientWithAuth(req.token);

	const { name, type, skillFocus, difficulty, notes, imageUrl } = req.body;

	const { data, error } = await supabase.from("Drill").insert([
		{
			name,
			type,
			skillFocus,
			difficulty,
			notes,
			imageUrl,
			user_id: req.user.id,
		},
	]);
	console.log(data, 'data?')
	if (error) {
		console.error("Supabase insert error:", error.message);
		return res.status(500).json({ error: error.message });
	}

	res.status(201).json(data);
});
