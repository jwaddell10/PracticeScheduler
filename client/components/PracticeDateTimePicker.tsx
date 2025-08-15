import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform, TextInput } from "react-native";
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
	const [duration, setDuration] = useState<number>(60); // Default 60 minutes

	useEffect(() => {
		const endDate = new Date(startDate);
		endDate.setMinutes(startDate.getMinutes() + duration);
		onDatesChange(startDate, endDate);
	}, [startDate, duration]);

	const onChangeStart = (_event: any, selectedDate?: Date) => {
		if (selectedDate) {
			setStartDate(selectedDate);
		}
	};

	const onChangeDuration = (text: string) => {
		const newDuration = parseInt(text) || 0;
		if (newDuration > 0) {
			setDuration(newDuration);
		}
	};

	return (
		<View>
			<View style={styles.section}>
				<View style={styles.startTimeContainer}>
					<Text style={styles.label}>Start Time</Text>
					<DateTimePicker
						value={startDate}
						mode="datetime"
						display="default"
						onChange={onChangeStart}
						themeVariant="dark"
						style={styles.datePicker}
					/>
				</View>
			</View>

			<View style={styles.section}>
				<View style={styles.durationContainer}>
					<Text style={styles.label}>Duration (minutes)</Text>
					<TextInput
						style={styles.durationInput}
						value={duration.toString()}
						onChangeText={onChangeDuration}
						keyboardType="numeric"
						placeholder="60"
						placeholderTextColor={theme.colors.textMuted}
						keyboardAppearance="dark"
					/>
				</View>
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
		width: 200,
		backgroundColor: Platform.OS === "android" ? "#1E293B" : "transparent",
		borderRadius: 12,
	},
	startTimeContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	durationContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	durationInput: {
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.textMuted,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: theme.colors.textPrimary,
		textAlign: "center",
		width: 100,
	},
});

export default PracticeDateTimePicker;
