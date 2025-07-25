// util/fetchDrills.ts
import { supabase } from "../lib/supabase";

export async function fetchUserDrills() {
	const { data: userData, error: userError } = await supabase.auth.getUser();
	if (userError) throw userError;
	if (!userData?.user) throw new Error("No user logged in");

	const { data: drills, error: drillError } = await supabase
		.from("Drill")
		.select("*")
		.eq("user_id", userData.user.id);

	if (drillError) throw drillError;
console.log(drills, 'drills fetchdrills')
	return drills;
}

