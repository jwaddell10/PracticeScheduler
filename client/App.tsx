import React, { useState, useEffect } from "react";
import Navigation from "./Navigation";
import { SessionContext } from "./context/SessionContext";
import { PracticesProvider } from "./context/PracticesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DrillsProvider } from "./context/DrillsContext";
import { supabase } from "./lib/supabase";
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export default function App() {
	const [session, setSession] = useState(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		// Handle deep links for email confirmation
		const handleDeepLink = (url: string) => {
			console.log('Deep link received:', url);
			
			// Check if this is an auth callback
			if (url.includes('auth/callback')) {
				// Let Supabase handle the auth callback
				supabase.auth.onAuthStateChange((event, session) => {
					if (event === 'SIGNED_IN' && session) {
						Alert.alert(
							"Email Confirmed!", 
							"Your email has been successfully verified. You can now use all features of the app."
						);
					}
				});
			}
		};

		// Handle initial URL if app was opened via deep link
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink(url);
			}
		});

		// Listen for incoming links when app is already running
		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url);
		});

		return () => subscription?.remove();
	}, []);

	return (
		<SessionContext.Provider value={session}>
			<FavoritesProvider>
				<DrillsProvider>
					<PracticesProvider>
						<Navigation/>
					</PracticesProvider>
				</DrillsProvider>
			</FavoritesProvider>
		</SessionContext.Provider>
	);
}
