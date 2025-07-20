const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts");

exports.fetchDrills = expressAsyncHandler(async (req, res) => {
	const { data, error } = await supabase.from("Drill").select("*");
	// console.log(data, 'data drills')
	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}
	res.status(200).json(data);
});

exports.createDrill = expressAsyncHandler(async (req, res) => {
	console.log(req.body, 'req body create drill')
    const { name, type, skillFocus, difficulty, notes, imageUrl } = req.body;

    const { data, error } = await supabase.from("Drill").insert([
        {
            name,
            type,
            skillFocus,
            difficulty,
            notes,
            imageUrl: imageUrl,
            // user_id: userId, // Use the userId from the authenticated user
        },
    ]);

    // console.log('Insert data:', data);
    
    if (error) {
        console.error("Supabase insert error:", error.message);
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
});
