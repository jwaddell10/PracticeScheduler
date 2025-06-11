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
		<View>
			<Text style={{textAlign: "left"}}>Hello, Coach</Text>
			
			<Calendar
				onDayPress={(day) => {
					console.log("selected day", day);
				}}
			/>
			<Button onPress={() => navigation.navigate("Drills")}>
				Schedule Practice
			</Button>
		</View>
	);
}
