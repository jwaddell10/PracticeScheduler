import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

export default function ContactUs() {
	const handleContactUs = async () => {
		const email = "practiceprovolleyball@gmail.com";
		const subject = "PracticePro Feedback";
		const body = "Hi PracticePro team,\n\nI'd like to share some feedback about the app:\n\n";
		
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		
		try {
			const supported = await Linking.canOpenURL(mailtoUrl);
			
			if (supported) {
				await Linking.openURL(mailtoUrl);
			} else {
				Alert.alert(
					"Email Not Available",
					"Please email us at practiceprovolleyball@gmail.com",
					[
						{ text: "Copy Email", onPress: () => {
							// You could add clipboard functionality here if needed
							Alert.alert("Email copied to clipboard", "practiceprovolleyball@gmail.com");
						}},
						{ text: "OK", style: "default" }
					]
				);
			}
		} catch (error) {
			Alert.alert(
				"Error",
				"Unable to open email app. Please email us at practiceprovolleyball@gmail.com"
			);
		}
	};

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Support & Feedback</Text>
			
			<Text style={styles.description}>
				We're always looking to improve PracticePro! Send us feedback, report bugs, or share your ideas for new features. We'd love to hear from you.
			</Text>
			
			<TouchableOpacity style={styles.contactButton} onPress={handleContactUs}>
				<MaterialIcons name="email" size={24} color={theme.colors.primary} />
				<View style={styles.contactTextContainer}>
					<Text style={styles.contactButtonText}>Contact Us</Text>
					<Text style={styles.contactSubtext}>Send feedback, ideas, or get help</Text>
				</View>
				<MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: theme.colors.textPrimary,
		marginBottom: 12,
	},
	description: {
		fontSize: 13,
		color: theme.colors.textMuted,
		lineHeight: 18,
		marginBottom: 12,
	},
	contactButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	contactTextContainer: {
		flex: 1,
		marginLeft: 10,
	},
	contactButtonText: {
		fontSize: 15,
		color: theme.colors.textPrimary,
		fontWeight: '600',
	},
	contactSubtext: {
		fontSize: 13,
		color: theme.colors.textMuted,
		marginTop: 2,
	},
});
