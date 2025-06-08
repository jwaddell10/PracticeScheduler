import { View, Text } from "react-native";
import { Button } from "@react-navigation/elements";
import {
	createStaticNavigation,
	useNavigation,
} from "@react-navigation/native";
import { Calendar, CalendarList, Agenda } from "react-native-calendars";


export default function HomeScreen() {
	const navigation = useNavigation();

	return (
		<View
			style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
		>
			<Text>Home Screen</Text>
			<Calendar
				onDayPress={(day) => {
					console.log("selected day", day);
				}}
			/>
			<Button onPress={() => navigation.navigate("Drills")}>
				Schedule Drills
			</Button>
		</View>
	);
}
