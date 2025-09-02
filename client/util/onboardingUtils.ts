import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetOnboarding = async () => {
	await AsyncStorage.removeItem('hasCompletedOnboarding');
	console.log('Onboarding status reset');
};

export const checkOnboardingStatus = async () => {
	const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
	const onboardingCompleted = hasCompletedOnboarding === 'true';
	console.log('Current onboarding status:', onboardingCompleted);
	return onboardingCompleted;
};

export const completeOnboarding = async () => {
	await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
	console.log('Onboarding marked as complete');
};
