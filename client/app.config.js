// app.config.js
import "dotenv/config";

export default () => ({
	expo: {
		scheme: "practicepro",
		name: "PracticePro Volleyball",
		slug: "PracticeScheduler",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/PPlogo.png",
		userInterfaceStyle: "dark",
		statusBar: {
			style: "light",
			backgroundColor: "#000000",
		},
		newArchEnabled: true,
		splash: {
			image: "./assets/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.jwaddell10.PracticeScheduler",
			teamId: "8NTS7W2P65", // Replace with your actual team ID
			associatedDomains: ["applinks:practiceprovolleyball.com"],
			infoPlist: {
				NSPhotoLibraryUsageDescription:
					"We need access to your photo library so you can upload an image for your drill.",
				NSCameraUsageDescription:
					"We need camera access to take photos for your drill.",
			},
		},

		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			edgeToEdgeEnabled: true,
			package: "com.jwaddell10.PracticeScheduler",
		},
		// web: {
		// 	favicon: "./assets/favicon.png",
		// },
		extra: {
			eas: {
				projectId: "7952f98e-4bdd-4d28-84ef-b4e9fe8951e0",
			},
			SUPABASE_KEY: process.env.SUPABASE_KEY,
			SUPABASE_URL: process.env.SUPABASE_URL,
			serverApi: process.env.SERVER_API,
			localIP: process.env.LOCAL_IP,
			PORT: process.env.PORT,
			REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY
		},
		plugins: ["expo-secure-store"],
	},
});
