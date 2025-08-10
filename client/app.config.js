// app.config.js
import "dotenv/config";

export default () => ({
	expo: {
		scheme: "com.supabase",
		name: "PracticeScheduler",
		slug: "PracticeScheduler",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "light",
		newArchEnabled: true,
		splash: {
			image: "./assets/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.jwaddell10.PracticeScheduler",
			buildNumber: "29",
			infoPlist: {
				NSPhotoLibraryUsageDescription:
					"We need access to your photo library so you can upload an image for your drill.",
				NSCameraUsageDescription:
					"We need camera access to take photos for your drill.",
			},
		},
		// android: {
		// 	adaptiveIcon: {
		// 		foregroundImage: "./assets/adaptive-icon.png",
		// 		backgroundColor: "#ffffff",
		// 	},
		// 	edgeToEdgeEnabled: true,
		// 	package: "com.jwaddell10.PracticeScheduler",
		// },
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
		},
		plugins: ["expo-secure-store"],
	},
});
