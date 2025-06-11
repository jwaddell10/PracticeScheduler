import { StatusBar } from "expo-status-bar";
import { Pressable, Alert, StyleSheet, Text, View } from "react-native";
import { Calendar, CalendarList, Agenda } from "react-native-calendars";
import { createStaticNavigation, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button } from '@react-navigation/elements';
import Navigation from "./Navigation";

export default function App() {
	return (
		<Navigation />
	);
}
