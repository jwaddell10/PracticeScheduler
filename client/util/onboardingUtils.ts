import { storage } from '../components/SplashScreen';

export const resetOnboarding = () => {
	storage.delete('hasCompletedOnboarding');
	console.log('Onboarding status reset');
};

export const checkOnboardingStatus = () => {
	const hasCompletedOnboarding = storage.getBoolean('hasCompletedOnboarding');
	console.log('Current onboarding status:', hasCompletedOnboarding);
	return hasCompletedOnboarding;
};

export const completeOnboarding = () => {
	storage.set('hasCompletedOnboarding', true);
	console.log('Onboarding marked as complete');
};
