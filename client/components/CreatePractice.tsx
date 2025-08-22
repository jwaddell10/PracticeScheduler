import { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	Button,
	Modal,
	Image,
	TextInput,
	Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation, useRoute } from "@react-navigation/native";
import PracticeDateTimePicker from "./PracticeDateTimePicker";
import { useDrills } from "../context/DrillsContext";
import { usePractices } from "../context/PracticesContext";
import { useFavorites } from "../context/FavoritesContext";
import { useSession } from "../context/SessionContext";
import { useDrillFilters } from "../hooks/useDrillFilters";
import { useUserRole } from "../context/UserRoleContext";
import DrillFilterModal from "./DrillFilterModal";
import DrillDetails from "./DrillDetails";
import AntDesign from "@expo/vector-icons/AntDesign";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";
import { useClipboard } from "../context/ClipboardContext";

interface DrillData {
	name: string;
	imageUrl?: string;
	skillFocus?: any;
	type?: any;
	difficulty?: any;
	duration?: number;
	notes?: string;
}

const CreatePractice = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { addPractice } = usePractices();
	const { role: userRole } = useUserRole();
	const [availableDrills, setAvailableDrills] = useState<string[]>([]);
	const [drillSelectionModalVisible, setDrillSelectionModalVisible] =
		useState(false);
	const [questionModalVisible, setQuestionModalVisible] = useState(false);
	const [selectedDrillForDetails, setSelectedDrillForDetails] =
		useState<DrillData | null>(null);
	const [drillSourceToggle, setDrillSourceToggle] = useState<'public' | 'user'>(
		userRole === 'premium' ? 'public' : 'user'
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	const [drills, setDrills] = useState<DrillData[]>([]);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
	const [drillDurations, setDrillDurations] = useState<{ [key: string]: number }>({});
	const [hasManuallyEditedDurations, setHasManuallyEditedDurations] = useState(false);
	const [notes, setNotes] = useState("");
	const [title, setTitle] = useState("Team Practice");
	const { clipboardDrills, refreshClipboard } = useClipboard();

	const {
		selectedFilters,
		skillFocusOptions,
		difficultyOptions,
		typeOptions,
		toggleFilter,
		clearAllFilters,
		hasActiveFilters,
		filterDrills,
	} = useDrillFilters();

	const {
		publicDrills: drillsData,
		userDrills,
		loading: drillsLoading,
		error: drillsError,
	} = useDrills();

	const {
		favoriteDrills,
		favoriteDrillIds,
		loading: favoritesLoading,
		error: favoritesError,
	} = useFavorites();

	const session = useSession();

	// Initialize selected drills from clipboard when component mounts
	useEffect(() => {
		if (clipboardDrills.length > 0) {
			// Set selected drills from clipboard
			setSelectedDrills(clipboardDrills.map(drill => drill.name));
			
			// Auto-calculate drill durations if we have start and end dates
			if (startDate && endDate) {
				const totalDuration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
				const durationPerDrill = Math.floor(totalDuration / clipboardDrills.length);
				const remainder = totalDuration % clipboardDrills.length;
				
				const initialDurations: { [key: string]: number } = {};
				clipboardDrills.forEach((drill, index) => {
					// Distribute remainder to first few drills
					const extraMinute = index < remainder ? 1 : 0;
					initialDurations[drill.name] = durationPerDrill + extraMinute;
				});
				setDrillDurations(initialDurations);
			} else {
				// Fallback to existing durations or 0
				const initialDurations: { [key: string]: number } = {};
				clipboardDrills.forEach(drill => {
					initialDurations[drill.name] = drill.duration || 0;
				});
				setDrillDurations(initialDurations);
			}
		}
	}, [clipboardDrills, startDate, endDate]);

	// Update local state when hook data changes
	useEffect(() => {
		let currentDrills: any[] = [];
		
		if (drillSourceToggle === 'public' && drillsData && drillsData.length > 0) {
			currentDrills = drillsData;
		} else if (drillSourceToggle === 'user') {
			// Combine user's own drills and favorites
			const combined = [];
			const seenIds = new Set();

			if (userDrills) {
				userDrills.forEach((drill) => {
					if (drill.user_id === session?.user?.id) {
						combined.push(drill);
						seenIds.add(drill.id);
					}
				});
			}

			if (favoriteDrills) {
				favoriteDrills.forEach((drill) => {
					if (
						drill.user_id !== session?.user?.id &&
						!seenIds.has(drill.id)
					) {
						combined.push(drill);
						seenIds.add(drill.id);
					}
				});
			}
			currentDrills = combined;
		}

		// Apply filters
		const filteredDrills = filterDrills(currentDrills);

		// Apply search filter
		const searchFilteredDrills = searchQuery.trim() === "" 
			? filteredDrills 
			: filteredDrills.filter((drill) => {
				const searchLower = searchQuery.toLowerCase();
				return (
					drill.name?.toLowerCase().includes(searchLower) ||
					drill.skillFocus?.toLowerCase().includes(searchLower) ||
					drill.type?.toLowerCase().includes(searchLower) ||
					drill.difficulty?.toLowerCase().includes(searchLower) ||
					drill.notes?.toLowerCase().includes(searchLower)
				);
			});

		setAvailableDrills(searchFilteredDrills.map((d: any) => d.name));
		setDrills(searchFilteredDrills);
	}, [drillsData, userDrills, favoriteDrills, drillSourceToggle, session?.user?.id, selectedFilters, searchQuery]);

	// Organize drills by type and skill focus
	const organizeDrills = (drills: any[]) => {
		const organized = {};
		
		drills.forEach((drill) => {
			// Parse type
			let drillType = ["Individual"];
			if (drill.type) {
				try {
					const parsed = JSON.parse(drill.type);
					drillType = Array.isArray(parsed) ? parsed : [parsed];
				} catch {
					drillType = [drill.type];
				}
			}
			
			// Determine if it's a team drill or individual drill
			const isTeamDrill = drillType.some((type) => 
				type.toLowerCase().includes("team")
			);
			const typeKey = isTeamDrill ? "team" : "individual";
			
			// Parse skill focus
			let skillFocuses = ["General"];
			if (drill.skillFocus) {
				try {
					const parsed = JSON.parse(drill.skillFocus);
					const skills = Array.isArray(parsed) ? parsed : [parsed];
					if (skills.length > 0) {
						skillFocuses = skills.map(skill => skill.toLowerCase());
					}
				} catch {
					if (drill.skillFocus) {
						skillFocuses = [drill.skillFocus.toLowerCase()];
					}
				}
			}
			
			// Add drill to each skill focus category
			skillFocuses.forEach(skillFocus => {
				if (!organized[typeKey]) {
					organized[typeKey] = {};
				}
				if (!organized[typeKey][skillFocus]) {
					organized[typeKey][skillFocus] = [];
				}
				organized[typeKey][skillFocus].push(drill);
			});
		});
		
		return organized;
	};

	const organizedDrills = organizeDrills(drills);

	// Handle loading and error states if needed
	if (drillsLoading) {
		return <Text>Loading drills...</Text>;
	}

	if (drillsError) {
		return <Text>Error loading drills: {drillsError}</Text>;
	}

	const handleDatesChange = (start: Date, end: Date) => {
		setStartDate(start);
		setEndDate(end);
		
		// Auto-calculate drill durations when dates change (only if user hasn't manually edited)
		if (start && end && selectedDrills.length > 0 && !hasManuallyEditedDurations) {
			const totalDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
			const durationPerDrill = Math.floor(totalDuration / selectedDrills.length);
			const remainder = totalDuration % selectedDrills.length;
			
			const newDrillDurations: { [key: string]: number } = {};
			selectedDrills.forEach((drill, index) => {
				// Distribute remainder to first few drills
				const extraMinute = index < remainder ? 1 : 0;
				newDrillDurations[drill] = durationPerDrill + extraMinute;
			});
			
			setDrillDurations(newDrillDurations);
		}
	};

	function toLocalISOString(date: Date) {
		const tzoffset = date.getTimezoneOffset() * 60000; // offset in ms
		return new Date(date.getTime() - tzoffset).toISOString().slice(0, -1);
	}

	const handleSubmit = async () => {
		if (!startDate || !endDate) {
			alert("Please select valid start and end times");
			return;
		}
		
		// Check if the practice is in the past
		const now = new Date();
		if (startDate <= now) {
			alert("Cannot create a practice in the past. Please select a future date and time.");
			return;
		}
		
		if (endDate <= startDate) {
			alert("End time must be after start time");
			return;
		}

		// Convert drillDurations object to array format for database storage
		const drillDurationArray: number[] = [];
		selectedDrills.forEach(drillName => {
			// Get the duration for this drill from the drillDurations object
			const drillDuration = drillDurations[drillName] || 0;
			drillDurationArray.push(drillDuration);
		});

		try {
			await addPractice({
				title: title || "Practice",
				startTime: toLocalISOString(startDate),
				endTime: toLocalISOString(endDate),
				teamId: "b2416750-a2c4-4142-a47b-d0fd11ca678a",
				drills: selectedDrills,
				practiceDuration: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
				notes: notes || undefined,
			});

			// Keep clipboard drills - only clear local state
			setSelectedDrills([]);
			setDrillDurations({});

			navigation.goBack();
		} catch (error) {
			alert("Failed to create practice. Please try again.");
		}
	};

	// Format date for header display
	const formatSelectedDate = () => {
		if (startDate) {
			return startDate.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		}
		return null;
	};

	// Function to remove a drill from selected drills
	const removeDrill = (drillToRemove: string) => {
		setSelectedDrills((prev) =>
			prev.filter((drill) => drill !== drillToRemove)
		);
		// Remove drill duration when drill is removed
		const newDrillDurations = { ...drillDurations };
		delete newDrillDurations[drillToRemove];
		setDrillDurations(newDrillDurations);
		setHasManuallyEditedDurations(false); // Reset flag when drills change
	};

	const updateDrillDuration = (drillName: string, duration: number) => {
		setDrillDurations(prev => ({
			...prev,
			[drillName]: duration
		}));
		setHasManuallyEditedDurations(true);
	};

	const getTotalDrillDuration = () => {
		return Object.values(drillDurations).reduce((total, duration) => total + duration, 0);
	};

	const isDurationValid = () => {
		if (!startDate || !endDate) return false;
		const totalDuration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
		return getTotalDrillDuration() === totalDuration;
	};

	// Handle question modal close - reopen drill selection modal
	const handleQuestionModalClose = () => {
		setQuestionModalVisible(false);
		setSelectedDrillForDetails(null);
		setDrillSelectionModalVisible(true);
	};

	// Handle drill question icon click
	const handleDrillQuestionClick = (drillName: string) => {
		const drillObject = drills.find((d: DrillData) => d.name === drillName);
		setSelectedDrillForDetails(drillObject || null);
		setDrillSelectionModalVisible(false);
		setQuestionModalVisible(true);
	};

	// Handle drill details open from drill selection modal
	const handleDrillDetailsOpen = (drill: DrillData) => {
		setSelectedDrillForDetails(drill);
		setDrillSelectionModalVisible(false); // Close drill selection modal first
		setQuestionModalVisible(true);
	};

	// Helper function to capitalize first letter
	const capitalize = (str: string) => {
		return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
	};

	// Helper function to parse and format array data
	const formatArrayData = (data: any) => {
		if (!data) return "Not specified";

		try {
			// If it's a JSON string, parse it
			const parsed = JSON.parse(data);
			if (Array.isArray(parsed)) {
				return parsed
					.map((item: string) => capitalize(item))
					.join(", ");
			}
			return capitalize(data);
		} catch (error) {
			// If parsing fails, treat as regular string
			return capitalize(data);
		}
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<KeyboardAvoidingView
						style={{ flex: 1 }}
						behavior={Platform.OS === "ios" ? "padding" : undefined}
						keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
					>
						<View style={{ flex: 1 }} pointerEvents="box-none">
							<ScrollView
								contentContainerStyle={styles.scrollView}
								keyboardShouldPersistTaps="handled"
								nestedScrollEnabled={false}
								showsVerticalScrollIndicator={false}
								onScrollBeginDrag={() => Keyboard.dismiss()}
								scrollEventThrottle={16}
								alwaysBounceVertical={true}
							>
									{formatSelectedDate() && (
										<View style={styles.headerContainer} pointerEvents="box-none">
											<Text style={styles.headerTitle}>
												Create Practice
											</Text>
											<Text style={styles.selectedDateText}>
												{formatSelectedDate()}
											</Text>
										</View>
									)}
									
									{/* Practice Title */}
									<View style={styles.section} pointerEvents="box-none">
										<Text style={styles.label}>Practice Title</Text>
										<TextInput
											style={styles.titleInput}
											value={title}
											onChangeText={setTitle}
											placeholder="Enter practice title..."
											placeholderTextColor={theme.colors.textMuted}
											keyboardAppearance="dark"
										/>
									</View>

									<PracticeDateTimePicker
										initialDate={(route.params as any)?.selectedDate}
										onDatesChange={handleDatesChange}
									/>

									{/* Notes Section */}
									<View style={styles.section} pointerEvents="box-none">
										<Text style={styles.label}>Notes (Optional)</Text>
										<TextInput
											style={styles.notesInput}
											value={notes}
											onChangeText={setNotes}
											placeholder="Add any additional notes for this practice..."
											placeholderTextColor={theme.colors.textMuted}
											multiline={true}
											numberOfLines={4}
											keyboardAppearance="dark"
										/>
									</View>

									{/* Drills */}
									<View style={styles.section} pointerEvents="box-none">
										<Text style={styles.label}>
											Selected Drills
										</Text>
										
																				{clipboardDrills.length === 0 ? (
											<View style={styles.emptyClipboardContainer} pointerEvents="box-none">
												<Text style={styles.emptyClipboardText}>
													You haven't added any drills to your clipboard
												</Text>
												<TouchableOpacity
													style={styles.browseDrillsButton}
													onPress={() => {
														// Navigate to the YourDrills tab
														(navigation as any).navigate("FavoriteTab");
													}}
												>
													<Text style={styles.browseDrillsButtonText}>
														Browse Drills
													</Text>
												</TouchableOpacity>
											</View>
										) : (
											<View style={styles.clipboardInfoContainer} pointerEvents="box-none">
												<Text style={styles.clipboardInfoText}>
													{clipboardDrills.length} drill{clipboardDrills.length !== 1 ? 's' : ''} from clipboard
												</Text>
											</View>
										)}

										{/* Duration Validation Error */}
										{selectedDrills.length > 0 && !isDurationValid() && (
											<Text style={styles.validationText}>
												⚠️ Drill durations ({getTotalDrillDuration()} min) must equal practice duration ({startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : 0} min)
											</Text>
										)}

										{/* Display Selected Drills */}
										{selectedDrills.length > 0 && (
											<View style={styles.selectedDrillsContainer} pointerEvents="box-none">
												{selectedDrills.map((drill, index) => (
													<View key={index} style={styles.selectedDrillItem} pointerEvents="box-none">
														<Text style={styles.selectedDrillText}>
															{drill}
														</Text>
														<View style={styles.drillDurationContainer} pointerEvents="box-none">
															<Text style={styles.durationLabel}>Duration:</Text>
															<TextInput
																style={styles.drillDurationInput}
																value={drillDurations[drill]?.toString() || ""}
																onChangeText={(text) => {
									const value = text === "" ? 0 : parseInt(text) || 0;
									updateDrillDuration(drill, value);
								}}
																keyboardType="numeric"
																placeholder="0"
																placeholderTextColor={theme.colors.textMuted}
																keyboardAppearance="dark"
															/>
															<Text style={styles.durationUnit}>min</Text>
														</View>
														<TouchableOpacity
															onPress={() => removeDrill(drill)}
															style={styles.removeDrillButton}
														>
															<Text style={styles.removeDrillButtonText}>
																×
															</Text>
														</TouchableOpacity>
													</View>
												))}
											</View>
										)}

										{selectedDrills.length === 0 && (
											<Text style={styles.noDrillsText}>
												No drills selected yet
											</Text>
										)}



										{/* Drill Selection Modal */}
										<Modal
											visible={drillSelectionModalVisible}
											animationType="slide"
											transparent={true}
											onRequestClose={() => setDrillSelectionModalVisible(false)}
										>
											<View style={styles.modalBackdrop}>
												<View style={styles.modalContent}>
													<Text style={styles.modalTitle}>
														Select Drills
													</Text>
													
													{/* Drill Source Toggle - Only show for premium users */}
													{userRole === 'premium' && (
														<View style={styles.toggleContainer}>
															<TouchableOpacity
																style={[
																	styles.toggleButton,
																	drillSourceToggle === 'public' && styles.toggleButtonActive
																]}
																onPress={() => setDrillSourceToggle('public')}
															>
																<Text style={[
																	styles.toggleButtonText,
																	drillSourceToggle === 'public' && styles.toggleButtonTextActive
																]}>
																	Drills
																</Text>
															</TouchableOpacity>
															<TouchableOpacity
																style={[
																	styles.toggleButton,
																	drillSourceToggle === 'user' && styles.toggleButtonActive
																]}
																onPress={() => setDrillSourceToggle('user')}
															>
																<Text style={[
																	styles.toggleButtonText,
																	drillSourceToggle === 'user' && styles.toggleButtonTextActive
																]}>
																	Your Drills
																</Text>
															</TouchableOpacity>
														</View>
													)}
													
													{/* Search Bar */}
													<View style={styles.searchContainer}>
														<View style={styles.searchInputContainer}>
															<MaterialIcons
																name="search"
																size={20}
																color={theme.colors.textMuted}
																style={styles.searchIcon}
															/>
															<TextInput
																style={styles.searchInput}
																placeholder="Search drills..."
																value={searchQuery}
																onChangeText={setSearchQuery}
																placeholderTextColor={theme.colors.textMuted}
																keyboardAppearance="dark"
															/>
															{searchQuery.length > 0 && (
																<TouchableOpacity
																	onPress={() => setSearchQuery("")}
																	style={styles.clearSearchButton}
																>
																	<MaterialIcons
																		name="close"
																		size={20}
																		color={theme.colors.textMuted}
																	/>
																</TouchableOpacity>
															)}
															<TouchableOpacity
																onPress={() => {
																	setDrillSelectionModalVisible(false); // Close drill selection modal first
																	setShowFilters(true);
																}}
																style={[
																	styles.filterButton,
																	hasActiveFilters() && styles.filterButtonActive,
																]}
															>
																<MaterialIcons
																	name="filter-list"
																	size={20}
																	color={hasActiveFilters() ? theme.colors.white : theme.colors.textMuted}
																/>
																{hasActiveFilters() && <View style={styles.filterBadge} />}
															</TouchableOpacity>
														</View>
													</View>
													
													<ScrollView
														style={{ maxHeight: 400 }}
														showsVerticalScrollIndicator={false}
														nestedScrollEnabled={true}
													>
														{Object.keys(organizedDrills).length === 0 ? (
															<View style={styles.emptyState}>
																<Text style={styles.emptyStateText}>
																	No drills found
																</Text>
															</View>
														) : (
															Object.entries(organizedDrills).map(([type, skillFocusGroups]) => (
																<View key={type} style={styles.drillSection}>
																	<Text style={styles.header}>
																		{type.replace(/\b\w/g, (c) => c.toUpperCase())} Drills (
																		{Object.values(skillFocusGroups).flat().length})
																	</Text>
																	{Object.entries(skillFocusGroups).map(([skillFocus, drills]) => (
																		<View key={`${type}-${skillFocus}`} style={styles.drillSubSection}>
																			<Text style={styles.categoryTitle}>
																				{skillFocus.replace(/\b\w/g, (c) => c.toUpperCase())} ({drills.length})
																			</Text>
																			{drills.map((drill) => {
																				const selected = selectedDrills.includes(drill.name);
																				return (
																					<View
																						key={drill.id}
																						style={[
																							styles.drillItem,
																							selected && styles.drillItemSelected,
																						]}
																					>
																						<TouchableOpacity
																							style={styles.drillItemContent}
																							onPress={() => {
																								if (selected) {
																									setSelectedDrills((prev) =>
																										prev.filter((d) => d !== drill.name)
																									);
																								} else {
																									setSelectedDrills((prev) => [...prev, drill.name]);
																								}
																								setHasManuallyEditedDurations(false); // Reset flag when drills change
																							}}
																						>
																							<Text
																								style={[
																									styles.drillItemText,
																									selected && styles.drillItemTextSelected,
																								]}
																							>
																								{drill.name}
																							</Text>
																						</TouchableOpacity>
																						<TouchableOpacity
																							style={styles.questionIcon}
																							onPress={() => {
																								handleDrillDetailsOpen(drill);
																							}}
																						>
																							<MaterialIcons
																								name="help-outline"
																								size={20}
																								color={selected ? theme.colors.white : theme.colors.textMuted}
																							/>
																						</TouchableOpacity>
																					</View>
																				);
																			})}
																		</View>
																	))}
																</View>
															))
														)}
													</ScrollView>
													<TouchableOpacity
														style={styles.closeModalButton}
														onPress={() => setDrillSelectionModalVisible(false)}
													>
														<Text style={styles.closeModalButtonText}>
															Done
														</Text>
													</TouchableOpacity>
												</View>
											</View>
										</Modal>

										{/* Question Modal - Drill Details */}
										<Modal
											visible={questionModalVisible}
											animationType="slide"
											transparent={true}
											onRequestClose={handleQuestionModalClose}
										>
											<View style={styles.modalBackdrop}>
												<View style={styles.modalContent}>
													<Text style={styles.modalTitle}>
														Drill Details
													</Text>
													
													{/* Drill Details Content */}
													<ScrollView
														style={{ maxHeight: 400 }}
														showsVerticalScrollIndicator={false}
														nestedScrollEnabled={true}
													>
														<View style={{ padding: 20 }}>
															{selectedDrillForDetails ? (
																<>
																	{/* Drill Name */}
																	<Text
																		style={[
																			styles.modalTitle,
																			{
																				marginBottom: 20,
																			},
																		]}
																	>
																		{selectedDrillForDetails.name}
																	</Text>

																	{/* Drill Image */}
																	{selectedDrillForDetails.imageUrl && (
																		<View
																			style={{
																				marginBottom: 20,
																				alignItems: "center",
																			}}
																		>
																			<Image
																				source={{
																					uri: selectedDrillForDetails.imageUrl,
																				}}
																				style={{
																					width: 250,
																					height: 200,
																					borderRadius: 8,
																					resizeMode: "cover",
																				}}
																			/>
																		</View>
																	)}

																	{/* Drill Details */}
																	<View
																		style={{
																			marginBottom: 20,
																		}}
																	>
																		<View
																			style={{
																				flexDirection: "row",
																				marginBottom: 8,
																			}}
																		>
																			<Text
																				style={{
																					fontWeight: "bold",
																					flex: 1,
																					color: theme.colors.textPrimary,
																				}}
																			>
																				Difficulty:
																			</Text>
																			<Text
																				style={{
																					flex: 2,
																					color: theme.colors.textPrimary,
																				}}
																			>
																				{formatArrayData(
																					selectedDrillForDetails.difficulty
																				)}
																			</Text>
																		</View>

																		{selectedDrillForDetails.duration && (
																			<View
																				style={{
																					flexDirection: "row",
																					marginBottom: 8,
																				}}
																			>
																				<Text
																					style={{
																						fontWeight: "bold",
																						flex: 1,
																						color: theme.colors.textPrimary,
																					}}
																				>
																					Duration:
																				</Text>
																				<Text
																					style={{
																						flex: 2,
																						color: theme.colors.textPrimary,
																					}}
																				>
																					{selectedDrillForDetails.duration} min
																				</Text>
																			</View>
																		)}
																	</View>

																	{/* Description/Notes */}
																	{selectedDrillForDetails.notes &&
																	selectedDrillForDetails.notes.trim() !== "" ? (
																		<>
																			<Text
																				style={{
																					fontWeight: "bold",
																					fontSize: 16,
																					marginBottom: 8,
																					color: theme.colors.textPrimary,
																				}}
																			>
																				Description
																			</Text>
																			<Text
																				style={{
																					lineHeight: 20,
																					color: theme.colors.textMuted,
																				}}
																			>
																				{selectedDrillForDetails.notes}
																			</Text>
																		</>
																	) : (
																		<Text
																			style={{
																				fontStyle: "italic",
																				color: theme.colors.textMuted,
																			}}
																		>
																			No description available for this drill.
																		</Text>
																	)}
																</>
															) : (
																<Text style={{ 
																	color: theme.colors.textMuted, 
																	fontSize: 16, 
																	textAlign: 'center',
																	fontStyle: 'italic'
																}}>
																	No drill data available
																</Text>
															)}
														</View>
													</ScrollView>

													<TouchableOpacity
														style={styles.closeModalButton}
														onPress={handleQuestionModalClose}
													>
														<Text style={styles.closeModalButtonText}>
															Back to Drill Selection
														</Text>
													</TouchableOpacity>
												</View>
											</View>
										</Modal>
									</View>
								</ScrollView>
								
								{/* Sticky Submit Button */}
								<View style={styles.stickyButtonContainer}>
									<TouchableOpacity
										style={styles.submitButton}
										onPress={isDurationValid() ? handleSubmit : () => {
											Alert.alert(
												"Duration Mismatch",
												`Total drill duration (${getTotalDrillDuration()} min) must equal practice duration (${startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : 0} min)`
											);
										}}
										activeOpacity={0.8}
									>
										<Text style={styles.submitButtonText}>
											Create Practice
										</Text>
									</TouchableOpacity>
								</View>
							</View>
					</KeyboardAvoidingView>
				</GestureHandlerRootView>

				{/* Drill Filter Modal */}
				<DrillFilterModal
					visible={showFilters}
					onClose={() => {
						setShowFilters(false);
						setDrillSelectionModalVisible(true); // Reopen drill selection modal
					}}
					selectedFilters={selectedFilters}
					skillFocusOptions={skillFocusOptions}
					difficultyOptions={difficultyOptions}
					typeOptions={typeOptions}
					toggleFilter={toggleFilter}
					clearAllFilters={clearAllFilters}
					filteredCount={drills.length}
					extraTopPadding={true}
				/>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollView: {
		padding: 16,
		paddingBottom: 100, // Increased to account for sticky button
		flexGrow: 1,
	},
	headerContainer: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,
		elevation: 3,
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	selectedDateText: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.secondary,
	},
	section: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,
		elevation: 3,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 12,
	},
	titleInput: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 12,
		fontSize: 16,
		color: theme.colors.textPrimary,
		backgroundColor: theme.colors.background,
	},
	selectedDrillsContainer: {
		marginTop: 16,
	},
	selectedDrillItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.primary,
		borderWidth: 1,
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 8,
	},
	selectedDrillText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		fontWeight: "500",
		flex: 1,
	},
	removeDrillButton: {
		backgroundColor: "#ff4444",
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	removeDrillButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		lineHeight: 16,
	},
	noDrillsText: {
		fontSize: 14,
		color: "#999",
		fontStyle: "italic",
		marginTop: 8,
		textAlign: "center",
	},
	drillDurationContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 8,
	},
	durationLabel: {
		color: theme.colors.textMuted,
		fontSize: 14,
		marginRight: 4,
	},
	drillDurationInput: {
		backgroundColor: theme.colors.background,
		borderWidth: 1,
		borderColor: theme.colors.textMuted,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		fontSize: 14,
		color: theme.colors.textPrimary,
		textAlign: "center",
		width: 50,
	},
	durationUnit: {
		color: theme.colors.textMuted,
		fontSize: 12,
		marginLeft: 4,
	},
	validationText: {
		color: '#FF6B6B',
		fontSize: 14,
		marginBottom: 8,
		fontWeight: '500',
	},
	notesInput: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		minHeight: 100,
		backgroundColor: theme.colors.background,
		color: theme.colors.textPrimary,
		textAlignVertical: 'top',
	},
	submitButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 8,
		marginBottom: 20,
		shadowColor: theme.colors.primary,
		shadowOpacity: 0.4,
		shadowOffset: { width: 0, height: 5 },
		shadowRadius: 10,
		elevation: 5,
	},
	submitButtonText: {
		color: theme.colors.textPrimary,
		fontWeight: "700",
		fontSize: 18,
	},
	stickyButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: theme.colors.textMuted,
	},
	modalContent: {
		backgroundColor: theme.colors.surface,
		padding: 20,
		borderRadius: 12,
		maxHeight: '80%',
		marginHorizontal: 10,
		marginVertical: 50,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 16,
		color: theme.colors.textPrimary,
		textAlign: "center",
	},
	drillSection: {
		marginBottom: 20,
	},
	drillSubSection: {
		marginBottom: 16,
	},
	drillItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.surface,
		marginBottom: 16,
	},
	drillItemSelected: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
		borderWidth: 3,
	},
	drillItemText: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: "500",
	},
	drillItemTextSelected: {
		color: "#fff",
	},
	drillItemContent: {
		flex: 1,
		justifyContent: 'center',
	},
	questionIcon: {
		padding: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeModalButton: {
		marginTop: 16,
		backgroundColor: theme.colors.primary,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	closeModalButtonText: {
		color: "white",
		fontWeight: "600",
		fontSize: 16,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		padding: 20,
	},

	toggleContainer: {
		flexDirection: "row",
		backgroundColor: theme.colors.background,
		borderRadius: 12,
		padding: 4,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	toggleButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
	},
	toggleButtonActive: {
		backgroundColor: theme.colors.primary,
	},
	toggleButtonText: {
		color: theme.colors.textMuted,
		fontWeight: "500",
		fontSize: 14,
	},
	toggleButtonTextActive: {
		color: theme.colors.white,
		fontWeight: "600",
	},
	searchContainer: {
		marginBottom: 16,
	},
	searchInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.background,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: theme.colors.textPrimary,
		paddingVertical: 4,
	},
	clearSearchButton: {
		padding: 4,
	},
	filterButton: {
		padding: 8,
		borderRadius: 8,
		marginLeft: 8,
		position: "relative",
	},
	filterButtonActive: {
		backgroundColor: theme.colors.primary,
	},
	filterBadge: {
		position: "absolute",
		top: 2,
		right: 2,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: theme.colors.error,
	},
	header: {
		fontSize: 26,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginVertical: 12,
	},
	categoryTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		textTransform: "capitalize",
		marginBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		paddingBottom: 6,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 48,
	},
	emptyStateText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginTop: 16,
	},
	emptyClipboardContainer: {
		alignItems: "center",
		paddingVertical: 20,
	},
	emptyClipboardText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginBottom: 16,
		textAlign: "center",
	},
	browseDrillsButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
	},
	browseDrillsButtonText: {
		color: theme.colors.white,
		fontWeight: "600",
		fontSize: 16,
	},
	clipboardInfoContainer: {
		backgroundColor: theme.colors.surface,
		borderRadius: 8,
		padding: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	clipboardInfoText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		textAlign: "center",
	},
});

export default CreatePractice;
