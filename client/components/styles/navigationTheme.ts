import { DefaultTheme } from "@react-navigation/native";
import theme from "./theme"; // Adjust path as needed

export const navigationTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: theme.colors.background, // Screen background
		card: theme.colors.surface, // Header & tab bar
		text: theme.colors.textPrimary, // Header & tab bar text
		border: theme.colors.border, // Optional: border colors
		primary: theme.colors.primary, // Link/highlight
	},
};
