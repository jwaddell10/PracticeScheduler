import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClipboardDrills, ClipboardDrill } from '../util/clipboardManager';

interface ClipboardContextType {
	clipboardDrills: ClipboardDrill[];
	clipboardStatus: { [key: string]: boolean };
	isInitialized: boolean;
	refreshClipboard: () => Promise<void>;
	updateClipboardStatus: (drillId: string, isInClipboard: boolean) => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const useClipboard = () => {
	const context = useContext(ClipboardContext);
	if (!context) {
		throw new Error('useClipboard must be used within a ClipboardProvider');
	}
	return context;
};

interface ClipboardProviderProps {
	children: React.ReactNode;
}

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({ children }) => {
	const [clipboardDrills, setClipboardDrills] = useState<ClipboardDrill[]>([]);
	const [clipboardStatus, setClipboardStatus] = useState<{ [key: string]: boolean }>({});
	const [isInitialized, setIsInitialized] = useState(false);

	const refreshClipboard = async () => {
		try {
			const drills = await getClipboardDrills();
			setClipboardDrills(drills);
			
			// Update clipboard status for all drills
			const status: { [key: string]: boolean } = {};
			drills.forEach(drill => {
				status[drill.id] = true;
			});
			setClipboardStatus(status);
		} catch (error) {
			console.error('Error refreshing clipboard:', error);
		}
	};

	const updateClipboardStatus = (drillId: string, isInClipboard: boolean) => {
		setClipboardStatus(prev => ({
			...prev,
			[drillId]: isInClipboard
		}));
		
		// Refresh clipboard drills to keep them in sync
		refreshClipboard();
	};

	// Preload clipboard data on context initialization
	useEffect(() => {
		const initializeClipboard = async () => {
			try {
				await refreshClipboard();
			} catch (error) {
				console.error('Error initializing clipboard:', error);
			} finally {
				setIsInitialized(true);
			}
		};

		initializeClipboard();
	}, []);

	const value: ClipboardContextType = {
		clipboardDrills,
		clipboardStatus,
		isInitialized,
		refreshClipboard,
		updateClipboardStatus,
	};

	return (
		<ClipboardContext.Provider value={value}>
			{children}
		</ClipboardContext.Provider>
	);
};