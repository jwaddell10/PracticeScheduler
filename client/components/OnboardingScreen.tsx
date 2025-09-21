import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from './styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768 || screenHeight >= 1024;

interface OnboardingScreenProps {
	onComplete: () => void;
}

const onboardingSteps = [
	{
		id: 1,
		title: 'Welcome to PracticePro',
		subtitle: 'Your complete volleyball practice management solution',
		description: 'Create, organize, and manage your volleyball practices with ease. Build custom drills and access professional content.',
		image: require('../assets/Home.png'),
	},
	{
		id: 2,
		title: 'Create Custom Drills',
		subtitle: 'Build drills tailored to your team',
		description: 'Design drills that match your team\'s skill level and focus areas. Add images and detailed instructions.',
		image: require('../assets/FilterDrills.png'),
	},
	{
		id: 3,
		title: 'Professional Drill Library',
		subtitle: 'Premium subscribers only',
		description: 'Browse expertly crafted drills created by volleyball professionals. Filter by skill focus and difficulty level.',
		image: require('../assets/DrillLibrary.png'),
	},
	{
		id: 4,
		title: 'Plan Your Practices',
		subtitle: 'Organize with ease',
		description: 'Schedule practices, add drills to your clipboard, and create comprehensive practice plans.',
		image: require('../assets/CreatePractice.png'),
	},
	{
		id: 5,
		title: 'Help Us Improve',
		subtitle: 'Share your feedback',
		description: 'Have suggestions? We\'re always looking to add new features and improve your experience. Click \'Contact Us\' on the Account page.',
		image: require('../assets/Account.png'),
	},
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
	const [currentStep, setCurrentStep] = useState(0);

	const handleNext = async () => {
		if (currentStep < onboardingSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			// Complete onboarding
			await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
			onComplete();
		}
	};

	const handleSkip = async () => {
		// Complete onboarding
		await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
		onComplete();
	};

	const currentStepData = onboardingSteps[currentStep];

	return (
		<SafeAreaView style={styles.container}>
			{/* Skip Button */}
			<TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
				<Text style={styles.skipText}>Skip</Text>
			</TouchableOpacity>

			{/* Content */}
			<View style={styles.content}>
				{/* Image */}
				<View style={styles.imageContainer}>
					<Image
						source={currentStepData.image}
						style={styles.image}
						resizeMode="contain"
					/>
				</View>



				{/* Text Content */}
				<View style={styles.textContainer}>
					<Text style={styles.title}>{currentStepData.title}</Text>
					<Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
					<Text style={styles.description}>{currentStepData.description}</Text>
				</View>
			</View>

			{/* Bottom Section */}
			<View style={styles.bottomSection}>
				{/* Progress Dots */}
				<View style={styles.progressContainer}>
					{onboardingSteps.map((_, index) => (
						<View
							key={index}
							style={[
								styles.progressDot,
								index === currentStep && styles.progressDotActive,
							]}
						/>
					))}
				</View>

				{/* Next Button */}
				<TouchableOpacity style={styles.nextButton} onPress={handleNext}>
					<Text style={styles.nextButtonText}>
						{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
					</Text>
					<MaterialIcons
						name="arrow-forward"
						size={24}
						color={theme.colors.white}
					/>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	skipButton: {
		position: 'absolute',
		top: isTablet ? 60 : 40,
		right: isTablet ? 40 : 20,
		zIndex: 1,
		padding: isTablet ? 12 : 8,
	},
	skipText: {
		fontSize: isTablet ? 20 : 16,
		color: theme.colors.textMuted,
		fontWeight: '500',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	imageContainer: {
		alignItems: 'center',
        marginBottom: isTablet ? 20 : 10,
		flex: isTablet ? 0.6 : 0.6,
		justifyContent: 'flex-start',
		paddingTop: isTablet ? 40 : 30,
	},
	image: {
		width: isTablet ? screenWidth * 0.6 : screenWidth * 0.8,
		height: isTablet ? screenHeight * 0.4 : screenHeight * 0.45,
		maxHeight: isTablet ? screenHeight * 0.4 : screenHeight * 0.5,
	},

	textContainer: {
		alignItems: 'center',
		flex: isTablet ? 0.4 : 0.4,
		justifyContent: 'center',
		paddingHorizontal: isTablet ? 40 : 20,
	},
	title: {
		fontSize: isTablet ? 28 : 18,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		textAlign: 'center',
		marginBottom: isTablet ? 8 : 4,
	},
	subtitle: {
		fontSize: isTablet ? 18 : 13,
		fontWeight: '600',
		color: theme.colors.primary,
		textAlign: 'center',
		marginBottom: isTablet ? 12 : 6,
	},
	description: {
		fontSize: isTablet ? 16 : 11,
		color: theme.colors.textMuted,
		textAlign: 'center',
		lineHeight: isTablet ? 24 : 16,
		maxWidth: isTablet ? 500 : undefined,
	},
	bottomSection: {
		paddingHorizontal: isTablet ? 60 : 40,
		paddingBottom: isTablet ? 60 : 40,
	},
	progressContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: isTablet ? 32 : 24,
	},
	progressDot: {
		width: isTablet ? 12 : 8,
		height: isTablet ? 12 : 8,
		borderRadius: isTablet ? 6 : 4,
		backgroundColor: theme.colors.border,
		marginHorizontal: isTablet ? 6 : 4,
	},
	progressDotActive: {
		backgroundColor: theme.colors.primary,
		width: isTablet ? 32 : 24,
	},
	nextButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: isTablet ? 20 : 16,
		paddingHorizontal: isTablet ? 40 : 32,
		borderRadius: isTablet ? 16 : 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	nextButtonText: {
		color: theme.colors.white,
		fontSize: isTablet ? 22 : 18,
		fontWeight: '600',
		marginRight: isTablet ? 12 : 8,
	},
});
