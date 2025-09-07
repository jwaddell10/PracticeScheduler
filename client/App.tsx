import React, { useState, useEffect } from "react";
import { Platform, Alert, StatusBar } from "react-native";
import * as Linking from "expo-linking";
import Purchases from "react-native-purchases";
import { Session } from "@supabase/supabase-js";

import Navigation from "./Navigation";
import LoadingScreen from "./components/LoadingScreen";
import SplashScreen from "./components/SplashScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import { SessionContext } from "./context/SessionContext";
import { PracticesProvider } from "./context/PracticesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DrillsProvider } from "./context/DrillsContext";
import { UserRoleProvider } from "./context/UserRoleContext";
import { supabase } from "./lib/supabase";
import { resetOnboarding } from "./util/onboardingUtils";
import { setRevenueCatUser } from "./lib/revenueCat";
import "react-native-get-random-values";

// Expose reset function for testing
if (__DEV__) {
	(global as any).resetOnboarding = resetOnboarding;
}

export default function App() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [showSplash, setShowSplash] = useState(true);
	const [preFetchedData, setPreFetchedData] = useState<{
		practices: any[];
		publicDrills: any[];
		userDrills: any[];
	}>({
		practices: [],
		publicDrills: [],
		userDrills: [],
	});

	useEffect(() => {
		try {
			console.log('Initializing RevenueCat...');
			Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

			if (Platform.OS === 'ios') {
				Purchases.configure({ apiKey: "appl_VTApErVWbdFRrWEYqfslhIgvWub" });
				console.log('RevenueCat configured for iOS');
			}
			// } else if (Platform.OS === 'android') {
			// 	Purchases.configure({ apiKey: "appl_VTApErVWbdFRrWEYqfslhIgvWub" });
			// 	console.log('RevenueCat configured for Android');

			// 	// OR: if building for Amazon, be sure to follow the installation instructions then:
			// 	// Purchases.configure({ apiKey: <public_amazon_api_key>, useAmazon: true });
			// }
		} catch (error) {
			console.error('Error initializing RevenueCat:', error);
		}
	}, []);

	// Handle authentication and deep links
	useEffect(() => {
		const initializeApp = async () => {
			try {
				// Get initial session
				const { data: { session: initialSession } } = await supabase.auth.getSession();
				setSession(initialSession);
				
				// If we have a session, pre-fetch data
				if (initialSession) {
					
					// Set RevenueCat user ID
					try {
						await setRevenueCatUser(initialSession.user.id);
						console.log('RevenueCat user ID set:', initialSession.user.id);
					} catch (error) {
						console.warn('Failed to set RevenueCat user ID:', error);
					}
					
					// Set the session for RLS policies
					await supabase.auth.setSession({
						access_token: initialSession.access_token,
						refresh_token: initialSession.refresh_token,
					});
					
					// Pre-fetch practices
					const { data: practices } = await supabase
						.from("Practice")
						.select("id, title, startTime, endTime, drills, practiceDuration, notes, teamId, user_id")
						.eq("user_id", initialSession.user.id)
						.order("startTime", { ascending: true });
					
					// Pre-fetch public drills
					const { data: publicDrills } = await supabase
						.from("Drill")
						.select(`
							*,
							users!Drill_user_id_fkey (
								id,
								email,
								role
							)
						`)
						.eq("isPublic", true)
						.order("name");
					
					// Pre-fetch user drills
					const { data: userDrills } = await supabase
						.from("Drill")
						.select(`
							*,
							users!Drill_user_id_fkey (
								id,
								email,
								role
							)
						`)
						.eq("user_id", initialSession.user.id)
						.order("name");
					
					// Store pre-fetched data
					setPreFetchedData({
						practices: practices || [],
						publicDrills: publicDrills || [],
						userDrills: userDrills || [],
					});
					
				}
				
				setIsInitialized(true);
			} catch (error) {
				console.error('Error during app initialization:', error);
				setIsInitialized(true);
			} finally {
				setIsLoading(false);
			}
		};

		initializeApp();

		// Listen for auth state changes
		const {
			data: { subscription: authSubscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			setSession(session);

			// Set RevenueCat user ID when user signs in/out
			if (event === "SIGNED_IN" && session?.user) {
				try {
					await setRevenueCatUser(session.user.id);
					console.log('RevenueCat user ID set on sign in:', session.user.id);
				} catch (error) {
					console.warn('Failed to set RevenueCat user ID on sign in:', error);
				}
			} else if (event === "SIGNED_OUT") {
				try {
					await Purchases.logOut();
					console.log('RevenueCat user logged out');
				} catch (error) {
					console.warn('Failed to log out RevenueCat user:', error);
				}
			}

			// Handle successful email confirmation or sign in
			// if (event === "SIGNED_IN" && session) {
			// 	Alert.alert(
			// 		"Welcome!",
			// 		"You're now signed in and ready to use the app."
			// 	);
			// }
		});

		// Handle deep links for email confirmation
		const handleDeepLink = (url: string) => {

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

	// Show splash screen while checking onboarding status
	if (showSplash) {
		return (
			<>
				<StatusBar barStyle="light-content" backgroundColor="#000000" />
				<SplashScreen
					onOnboardingComplete={() => {
						setShowSplash(false);
						setShowOnboarding(false);
					}}
					onOnboardingIncomplete={() => {
						setShowSplash(false);
						setShowOnboarding(true);
					}}
				/>
			</>
		);
	}

	// Show onboarding screen
	if (showOnboarding) {
		return (
			<>
				<StatusBar barStyle="light-content" backgroundColor="#000000" />
				<OnboardingScreen
					onComplete={() => {
						setShowOnboarding(false);
					}}
				/>
			</>
		);
	}

	// Show loading screen while initializing
	if (isLoading || !isInitialized) {
		return (
			<>
				<StatusBar barStyle="light-content" backgroundColor="#000000" />
				<LoadingScreen />
			</>
		);
	}

	return (
		<>
			<StatusBar barStyle="light-content" backgroundColor="#000000" />
			<SessionContext.Provider value={session}>
				<UserRoleProvider>
					<FavoritesProvider>
						<DrillsProvider 
							initialPublicDrills={preFetchedData.publicDrills}
							initialUserDrills={preFetchedData.userDrills}
						>
							<PracticesProvider initialPractices={preFetchedData.practices}>
								<Navigation />
							</PracticesProvider>
						</DrillsProvider>
					</FavoritesProvider>
				</UserRoleProvider>
			</SessionContext.Provider>
		</>
	);
}
