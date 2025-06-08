import React from "react";
import {
	ScrollView,
	StyleSheet,
	TextInput,
	Text,
	View,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";

const DrillsForm = () => {
	const drills = {
		Serving: [
			"Target Serve Challenge",
			"Wall Serve Accuracy",
			"Consistent Float Serve Reps",
		],
		Passing: ["Wall Bumps", "Target Passing", "Move & Pass"],
		Setting: ["Wall Sets", "Self-Set Max Reps", "High-Set Control"],
		Defense: ["Dig or Die", "Cone Reaction Drill", "Scramble Save"],
		Hitting: [
			"Approach & Arm Swing",
			"Block + Hit Combo",
			"Cross-Court Kill",
		],
		Blocking: ["Shadow Blocking", "Read & Block", "Mirror Blocking"],
		TeamPlay: [
			"6v6 Game to 7 with Serve Receive Focus",
			"Wash Drill",
			"Free Ball Transition",
		],
	};
    //Drill
    //date set


	const [text, onChangeText] = React.useState("Drill goes here");
    // const [moreText, onChangeMoreText] = React.useState("Time goes here?")
	const [number, onChangeNumber] = React.useState("");

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollView}>
					<Calendar
						onDayPress={(day) => {
							console.log("selected day", day);
						}}
					/>
					<TextInput
						style={styles.input}
						onChangeText={onChangeText}
						value={text}
					/>
					{/* <TextInput
						style={styles.input}
						onChangeText={onChangeNumber}
						value={moreText}
						placeholder="useless placeholder"
						keyboardType="numeric"
					/> */}

					{Object.entries(drills).map(([category, drillList]) => (
						<View key={category} style={{ marginBottom: 16 }}>
							<Text style={styles.category}>{category}</Text>
							{drillList.map((drill, i) => (
								<Text key={i} style={styles.drillItem}>
									{drill}
								</Text>
							))}
						</View>
					))}
				</ScrollView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 32,
		flexGrow: 1, // ✅ Key to enable scrolling when content is taller than screen
	},
	input: {
		height: 40,
		marginVertical: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		paddingHorizontal: 10,
	},
	category: {
		fontWeight: "bold",
		fontSize: 18,
		marginTop: 12,
	},
	drillItem: {
		marginLeft: 10,
		marginVertical: 2,
	},
});

export default DrillsForm;

