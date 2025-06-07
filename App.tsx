import { StatusBar } from "expo-status-bar";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

export default function App() {
	return (
		<View style={styles.container}>
			<Text>Jonathan is the Greatest Developer of All Time (GDOAT)</Text>
			<Button
				title="Press me"
        color={"#f194ff"}
				onPress={() => Alert.alert("Simple Button pressed")}
			/>
			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
	},
});
