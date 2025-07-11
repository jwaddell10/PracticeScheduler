import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert } from "react-native";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";

export default function Account({ session }: { session: Session | null }) {
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState("");
	const [drills, setDrills] = useState("");
	// const [website, setWebsite] = useState("");
	// const [avatarUrl, setAvatarUrl] = useState("");

	useEffect(() => {
		if (session) getProfile();
	}, [session]);

	async function getProfile() {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("User")
				.select(`email, teams, drills`)
				.eq("id", session?.user.id)
				.single();
			if (error && status !== 406) {
				throw error;
			}
			if (data) {
				setEmail(data.email);
				// setWebsite(data.teams);
				setDrills(data.drills);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile({
		username,
		website,
		avatar_url,
	}: {
		username: string;
		website: string;
		avatar_url: string;
	}) {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const updates = {
				id: session?.user.id,
			};
			console.log(updates, "updates");

			const { error } = await supabase.from("User").upsert(updates);

			if (error) {
				throw error;
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.container}>
			<View style={[styles.verticallySpaced, styles.mt20]}>
				<Input label="Email" value={session?.user?.email} disabled />
			</View>
			{/* <View style={styles.verticallySpaced}>
				<Input
					label="Email"
					value={email || ""}
					onChangeText={(text) => setEmail(text)}
				/>
			</View> */}
			<View style={styles.verticallySpaced}>
				<Input
					label="Drills"
					value={drills || ""}
					onChangeText={(text) => setDrills(text)}
				/>
			</View>

			{/* <View style={[styles.verticallySpaced, styles.mt20]}>
				<Button
					title={loading ? "Loading ..." : "Update"}
					onPress={() =>
						updateProfile({
							username,
							website,
							avatar_url: avatarUrl,
						})
					}
					disabled={loading}
				/>
			</View> */}

			<View style={styles.verticallySpaced}>
				<Button
					title="Sign Out"
					onPress={() => supabase.auth.signOut()}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 40,
		padding: 12,
	},
	verticallySpaced: {
		paddingTop: 4,
		paddingBottom: 4,
		alignSelf: "stretch",
	},
	mt20: {
		marginTop: 20,
	},
});
