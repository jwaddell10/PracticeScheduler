import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import theme from './styles/theme';

// Initialize MMKV storage
export const storage = new MMKV();

interface SplashScreenProps {
	onOnboardingComplete: () => void;
	onOnboardingIncomplete: () => void;
}

export default function SplashScreen({ onOnboardingComplete, onOnboardingIncomplete }: SplashScreenProps) {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkOnboardingStatus = async () => {
			try {
				// Simulate a brief loading time for better UX
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				// Check if user has completed onboarding
				const hasCompletedOnboarding = storage.getBoolean('hasCompletedOnboarding');
				
				console.log('Onboarding status:', hasCompletedOnboarding);
				
				// Navigate based on onboarding status
				if (hasCompletedOnboarding) {
					onOnboardingComplete();
				} else {
					onOnboardingIncomplete();
				}
			} catch (error) {
				console.error('Error checking onboarding status:', error);
				// Default to onboarding if there's an error
				onOnboardingIncomplete();
			} finally {
				setIsLoading(false);
			}
		};

		checkOnboardingStatus();
	}, [onOnboardingComplete, onOnboardingIncomplete]);

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* App Logo */}
				<Image
					source={require('../assets/PPlogo.png')}
					style={styles.logo}
					resizeMode="contain"
				/>
				
				{/* App Name */}
				<Text style={styles.appName}>PracticePro</Text>
				<Text style={styles.tagline}>Volleyball Practice Scheduler</Text>
				
				{/* Loading Indicator */}
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading...</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	logo: {
		width: 120,
		height: 120,
		marginBottom: 24,
	},
	appName: {
		fontSize: 32,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	tagline: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginBottom: 48,
		textAlign: 'center',
	},
	loadingContainer: {
		alignItems: 'center',
		marginTop: 32,
	},
	loadingText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginTop: 12,
	},
});
