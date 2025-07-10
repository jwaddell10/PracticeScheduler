const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts");

exports.fetchDrills = expressAsyncHandler(async (req, res) => {
	const { data, error } = await supabase.from("Drill").select("*");

	if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}

	res.status(200).json(data);
});

exports.createDrill = expressAsyncHandler(async (req, res) => {
	const { name, type, category, notes, image } = req.body;

	if (!name || !type || !category) {
		return res
			.status(400)
			.json({ error: "Name, type, and category are required." });
	}

	let imageUrl = null;

	if (image) {
		const buffer = Buffer.from(image, "base64");
		const filename = `drills/${Date.now()}.jpg`;

		const { error: uploadError } = await supabase.storage
			.from("drill-images")
			.upload(filename, buffer, {
				contentType: "image/jpeg",
				upsert: true,
			});

		if (uploadError) {
			console.error("Image upload error:", uploadError);
			return res.status(500).json({ error: "Failed to upload image." });
		}

		const { data: publicUrlData } = supabase.storage
			.from("drill-images")
			.getPublicUrl(filename);

		imageUrl = publicUrlData?.publicUrl || null;
	}

	const { data, error } = await supabase.from("Drill").insert([
		{
			name,
			type,
			category,
			notes,
			image_url: imageUrl, // Assuming your table has an `image_url` column
		},
	]);

	if (error) {
		console.error("Supabase insert error:", error);
		return res.status(500).json({ error: error.message });
	}

	res.status(201).json(data);
});
