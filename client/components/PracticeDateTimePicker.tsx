import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import theme from "./styles/theme";

type Props = {
	initialDate?: string;
	onDatesChange: (start: Date, end: Date) => void;
};

const PracticeDateTimePicker = ({ initialDate, onDatesChange }: Props) => {
	const parseLocalDateString = (isoDate: string) => {
		const [year, month, day] = isoDate.split("-").map(Number);
		return new Date(year, month - 1, day, 18, 0, 0);
	};

	const initializeDate = () => {
		if (initialDate) {
			return parseLocalDateString(initialDate);
		}
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
	};

	const [startDate, setStartDate] = useState<Date>(initializeDate());
	const [endDate, setEndDate] = useState<Date>(() => {
		const date = initializeDate();
		const endDate = new Date(date);
		endDate.setHours(date.getHours() + 1);
		return endDate;
	});

	useEffect(() => {
		onDatesChange(startDate, endDate);
	}, [startDate, endDate]);

	const onChange =
		(type: "start" | "end") => (_event: any, selectedDate?: Date) => {
			if (selectedDate) {
				if (type === "start") {
					setStartDate(selectedDate);
					if (endDate <= selectedDate) {
						const newEnd = new Date(selectedDate);
						newEnd.setHours(selectedDate.getHours() + 1);
						setEndDate(newEnd);
					}
				} else {
					if (selectedDate > startDate) {
						setEndDate(selectedDate);
					} else {
						const newEnd = new Date(startDate);
						newEnd.setHours(startDate.getHours() + 1);
						setEndDate(newEnd);
					}
				}
			}
		};

	return (
		<View>
			<View style={styles.section}>
				<Text style={styles.label}>Start Time</Text>
				<DateTimePicker
					value={startDate}
					mode="datetime"
					display="default" // <- native-style, no spinner
					onChange={onChange("start")}
					themeVariant="dark"
					style={styles.datePicker}
				/>
			</View>

			<View style={styles.section}>
				<Text style={styles.label}>End Time</Text>
				<DateTimePicker
					value={endDate}
					mode="datetime"
					display="default" // <- native-style, no spinner
					onChange={onChange("end")}
					themeVariant="dark"
					style={styles.datePicker}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		marginBottom: 20,
	},
	label: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	datePicker: {
		width: "100%",
		backgroundColor: Platform.OS === "android" ? "#1E293B" : "transparent",
		borderRadius: 12,
	},
});

export default PracticeDateTimePicker;
