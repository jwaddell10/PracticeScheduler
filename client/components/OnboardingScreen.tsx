import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { storage } from './SplashScreen';
import theme from './styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingScreenProps {
	onComplete: () => void;
}

const onboardingSteps = [
	{
		id: 1,
		title: 'Welcome to PracticePro',
		subtitle: 'Your complete volleyball practice management solution',
		description: 'Create, organize, and manage your volleyball practices with ease. Build custom drills and access professional content.',
		icon: 'sports-volleyball',
		image: require('../assets/volleyball.png'),
	},
	{
		id: 2,
		title: 'Create Custom Drills',
		subtitle: 'Build drills tailored to your team',
		description: 'Design drills that match your team\'s skill level and focus areas. Add images and detailed instructions.',
		icon: 'fitness-center',
		image: require('../assets/CreateDrill.png'),
	},
	{
		id: 3,
		title: 'Professional Drill Library',
		subtitle: 'Premium subscribers only',
		description: 'Browse expertly crafted drills created by volleyball professionals. Filter by skill focus and difficulty level.',
		icon: 'library-books',
		image: require('../assets/DrillLibrary.png'),
	},
	{
		id: 4,
		title: 'Plan Your Practices',
		subtitle: 'Organize with ease',
		description: 'Schedule practices, add drills to your clipboard, and create comprehensive practice plans.',
		icon: 'event',
		image: require('../assets/CreatePractice.png'),
	},
	{
		id: 5,
		title: 'Help Us Improve',
		subtitle: 'Share your feedback',
		description: 'Have suggestions? We\'re always looking to add new features and improve your experience. Click \'Contact Us\' on the Account page.',
		icon: 'feedback',
		image: require('../assets/AccountPage.png'),
	},
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
	const [currentStep, setCurrentStep] = useState(0);

	const handleNext = () => {
		if (currentStep < onboardingSteps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			// Complete onboarding
			storage.set('hasCompletedOnboarding', true);
			onComplete();
		}
	};

	const handleSkip = () => {
		// Complete onboarding
		storage.set('hasCompletedOnboarding', true);
		onComplete();
	};

	const currentStepData = onboardingSteps[currentStep];

	return (
		<View style={styles.container}>
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

				{/* Icon */}
				<View style={styles.iconContainer}>
									<MaterialIcons
					name={currentStepData.icon as any}
					size={40}
					color={theme.colors.primary}
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
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	skipButton: {
		position: 'absolute',
		top: 60,
		right: 20,
		zIndex: 1,
		padding: 8,
	},
	skipText: {
		fontSize: 16,
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
		marginBottom: 32,
		alignItems: 'center',
	},
	image: {
		width: screenWidth * 0.9,
		height: screenWidth * 0.7,
	},
	iconContainer: {
		marginBottom: 24,
		alignItems: 'center',
	},
	textContainer: {
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		textAlign: 'center',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.primary,
		textAlign: 'center',
		marginBottom: 12,
	},
	description: {
		fontSize: 14,
		color: theme.colors.textMuted,
		textAlign: 'center',
		lineHeight: 20,
	},
	bottomSection: {
		paddingHorizontal: 40,
		paddingBottom: 60,
	},
	progressContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 32,
	},
	progressDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: theme.colors.border,
		marginHorizontal: 4,
	},
	progressDotActive: {
		backgroundColor: theme.colors.primary,
		width: 24,
	},
	nextButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
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
		fontSize: 18,
		fontWeight: '600',
		marginRight: 8,
	},
});
