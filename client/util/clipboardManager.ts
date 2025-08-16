import AsyncStorage from "@react-native-async-storage/async-storage";

const CLIPBOARD_STORAGE_KEY = "practice_clipboard";

export interface ClipboardDrill {
	id: string;
	name: string;
	type?: string;
	skillFocus?: string;
	difficulty?: string;
	duration?: number;
	notes?: string;
}

export const addDrillToClipboard = async (drill: ClipboardDrill): Promise<void> => {
	try {
		const existingDrills = await getClipboardDrills();
		const isAlreadyInClipboard = existingDrills.some(d => d.id === drill.id);
		
		if (!isAlreadyInClipboard) {
			const updatedDrills = [...existingDrills, drill];
			await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(updatedDrills));
		}
	} catch (error) {
		console.error("Error adding drill to clipboard:", error);
		throw error;
	}
};

export const removeDrillFromClipboard = async (drillId: string): Promise<void> => {
	try {
		const existingDrills = await getClipboardDrills();
		const updatedDrills = existingDrills.filter(drill => drill.id !== drillId);
		await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(updatedDrills));
	} catch (error) {
		console.error("Error removing drill from clipboard:", error);
		throw error;
	}
};

export const getClipboardDrills = async (): Promise<ClipboardDrill[]> => {
	try {
		const storedDrills = await AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
		return storedDrills ? JSON.parse(storedDrills) : [];
	} catch (error) {
		console.error("Error getting clipboard drills:", error);
		return [];
	}
};

export const clearClipboard = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(CLIPBOARD_STORAGE_KEY);
	} catch (error) {
		console.error("Error clearing clipboard:", error);
		throw error;
	}
};

export const clearClipboardAfterPractice = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(CLIPBOARD_STORAGE_KEY);
	} catch (error) {
		console.error("Error clearing clipboard after practice:", error);
		throw error;
	}
};

export const isDrillInClipboard = async (drillId: string): Promise<boolean> => {
	try {
		const drills = await getClipboardDrills();
		return drills.some(drill => drill.id === drillId);
	} catch (error) {
		console.error("Error checking if drill is in clipboard:", error);
		return false;
	}
};
