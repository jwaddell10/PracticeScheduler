// uploadDrills.js
import { createClient } from "@supabase/supabase-js";
import { volleyballDrillsList } from "../../drillUploader/volleyballDrillsData.js"; // Ensure the JSON file is in the same folder or correct path

const supabaseUrl = process.env.EXPO_SUPABASE_PUBLIC_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service role key for backend use only
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadDrills() {
	for (const drillCategory of volleyballDrillsList) {
		const type = drillCategory.category;
		const category = drillCategory.subcategory;

		for (const drill of drillCategory.drills) {
			const { data, error } = await supabase.from("Drill").insert([
				{
					name: drill.name,
					type: type,
					category: category,
					notes: drill.description,
				},
			]);

			if (error) {
				console.error("Error inserting drill:", drill.name, error);
			} else {
				console.log("Inserted:", drill.name);
			}
		}
	}

	console.log("✅ Upload complete.");
}

uploadDrills();
