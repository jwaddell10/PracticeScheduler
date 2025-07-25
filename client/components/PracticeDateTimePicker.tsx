import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

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
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			18,
			0,
			0
		);
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
		(type: "start" | "end") => (event: any, selectedDate?: Date) => {
			if (selectedDate) {
				if (type === "start") {
					setStartDate(selectedDate);
					if (endDate <= selectedDate) {
						const newEndDate = new Date(selectedDate);
						newEndDate.setHours(selectedDate.getHours() + 1);
						setEndDate(newEndDate);
					}
				} else {
					if (selectedDate > startDate) {
						setEndDate(selectedDate);
					} else {
						const newEndDate = new Date(startDate);
						newEndDate.setHours(startDate.getHours() + 1);
						setEndDate(newEndDate);
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
					onChange={onChange("start")}
					style={styles.datePicker}
				/>
			</View>

			<View style={styles.section}>
				<Text style={styles.label}>End Time</Text>
				<DateTimePicker
					value={endDate}
					mode="datetime"
					onChange={onChange("end")}
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
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	datePicker: {
		width: "100%",
	},
});

export default PracticeDateTimePicker;
