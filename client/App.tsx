import React, { useState, useEffect } from "react";
import { Platform, Alert, StatusBar } from "react-native";
import * as Linking from "expo-linking";
import Purchases from "react-native-purchases";

import Navigation from "./Navigation";
import { SessionContext } from "./context/SessionContext";
import { PracticesProvider } from "./context/PracticesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DrillsProvider } from "./context/DrillsContext";
import { supabase } from "./lib/supabase";
import "react-native-get-random-values";

export default function App() {
	const [session, setSession] = useState(null);

	// Initialize RevenueCat Purchases
	// useEffect(() => {
	// 	const initRevenueCat = async () => {
	// 		try {
	// 			// Check if we're in a development environment
	// 			if (__DEV__) {
	// 				console.log('Development mode detected, initializing RevenueCat...');
	// 			}
	// 			
	// 			// Wait for app to be fully loaded and native modules to be ready
	// 			await new Promise(resolve => setTimeout(resolve, 5000));
	// 			
	// 			// Check if Purchases is available and has the required methods
	// 			if (Purchases && typeof Purchases.configure === 'function') {
	// 				try {
	// 					Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
	// 				} catch (logError) {
	// 					console.warn('Could not set log level:', logError);
	// 				}

	// 				// Use your actual API key for both platforms for now
	// 				Purchases.configure({
	// 					apiKey: "appl_VTApErVWbdFRrWEYqfslhIgvWub",
	// 				});
	// 				
	// 				console.log('RevenueCat SDK initialized successfully');
	// 			} else {
	// 				console.warn('RevenueCat Purchases not available or not properly loaded');
	// 			}
	// 		} catch (error) {
	// 			console.error('Failed to initialize RevenueCat:', error);
	// 		}
	// 	};
	// 	
	// 	// Delay initialization to ensure native modules are ready
	// 	const timer = setTimeout(initRevenueCat, 2000);
	// 	
	// 	return () => clearTimeout(timer);
	// }, []);

	// Handle authentication and deep links
	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		// Listen for auth state changes
		const {
			data: { subscription: authSubscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			setSession(session);

			// Handle successful email confirmation or sign in
			// if (event === "SIGNED_IN" && session) {
			// 	Alert.alert(
			// 		"Welcome!",
			// 		"You're now signed in and ready to use the app."
			// 	);
			// }
		});

		// Handle deep links for email confirmation
		const handleDeepLink = (url) => {
			console.log("Deep link received:", url);

			// Check if this is an auth callback
			if (url.includes("auth/callback")) {
				// Supabase will automatically handle the auth callback
				// and trigger the onAuthStateChange listener above
				console.log("Auth callback received:", url);
			}
		};

		// Handle initial URL if app was opened via deep link
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink(url);
			}
		});

		// Listen for incoming links when app is already running
		const linkingSubscription = Linking.addEventListener("url", (event) => {
			handleDeepLink(event.url);
		});

		// Cleanup function
		return () => {
			authSubscription?.unsubscribe();
			linkingSubscription?.remove();
		};
	}, []);

	return (
		<>
			<StatusBar barStyle="light-content" backgroundColor="#000000" />
			<SessionContext.Provider value={session}>
				<FavoritesProvider>
					<DrillsProvider>
						<PracticesProvider>
							<Navigation />
						</PracticesProvider>
					</DrillsProvider>
				</FavoritesProvider>
			</SessionContext.Provider>
		</>
	);
}
