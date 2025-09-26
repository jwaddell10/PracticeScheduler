import React, { useState, useLayoutEffect, useContext, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Modal,
	Alert,
	TextInput,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import StarButton from "./StarButton";
import { useDrills } from "../context/DrillsContext";
import { useFavorites } from "../context/FavoritesContext";
import DrillFilterModal from "./DrillFilterModal";
import UpgradeToPremiumBanner from "./UpgradeToPremiumBanner";
import theme from "./styles/theme";
import DrillCard from "./DrillCard";
import { supabase } from "../lib/supabase";
import { useSubscription } from "../context/SubscriptionContext";
export default function Drills() {

	const navigation = useNavigation();
	const { publicDrills: drills, loading: drillsLoading, error: drillsError, refreshAllDrills: refreshDrills } = useDrills();
	// console.log(drills, 'drills')
	const { favoriteDrillIds, handleFavoriteToggle } = useFavorites();	
	// Log subscription check result when it changes
	const [showFilters, setShowFilters] = useState(false);
	const [selectedFilters, setSelectedFilters] = useState<{
		skillFocus: string[];
		difficulty: string[];
		type: string[];
	}>({
		skillFocus: [],
		difficulty: [],
		type: [],
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [displayedDrills, setDisplayedDrills] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMoreDrills, setHasMoreDrills] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const DRILLS_PER_PAGE = 20; // Show 20 drills per page
	const prevFilteredDrillsRef = useRef<any[]>([]);
	const { isSubscriber, isAdmin, loading: subscriptionLoading, error: subscriptionError, refreshSubscription } = useSubscription();
	// Cache for storing already loaded drills by ID
	const [drillCache, setDrillCache] = useState(new Map<string, any>());
	const [cachedDrillIds, setCachedDrillIds] = useState(new Set<string>());

	const skillFocusOptions = [
		"Offense",
		"Defense",
		"Serve/Receive",
		"Blocking",
		"Warm-up",
	];
	const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
	const typeOptions = ["Team Drill", "Individual"];

	// Smart refresh on focus - only refresh if data is older than 30 seconds
	const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
	
	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			const now = Date.now();
			const timeSinceLastRefresh = now - lastRefreshTime;
			
			// Only refresh if it's been more than 30 seconds since last refresh
			if (timeSinceLastRefresh > 30000) {
				refreshDrills();
				setLastRefreshTime(now);
			}
		});
		return unsubscribe;
	}, [navigation, refreshDrills, lastRefreshTime]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => null,
		});
	}, [navigation]);
	

	const toggleFilter = (filterType: string, value: string) => {
		setSelectedFilters((prev) => {
			const currentFilters = prev[filterType as keyof typeof prev];
			const newFilters = currentFilters.includes(value)
				? currentFilters.filter((f: string) => f !== value)
				: [...currentFilters, value];
			return { ...prev, [filterType]: newFilters };
		});
	};

	const clearAllFilters = () => {
		setSelectedFilters({ skillFocus: [], difficulty: [], type: [] });
	};

	const loadMoreDrills = () => {
		if (isLoadingMore || !hasMoreDrills) return;
		
		setIsLoadingMore(true);
		
		// Use cached data if available, otherwise load from filtered drills
		const nextPage = currentPage + 1;
		const startIndex = (nextPage - 1) * DRILLS_PER_PAGE;
		const endIndex = startIndex + DRILLS_PER_PAGE;
		
		// Check if we have cached data for this page
		const cachedPageDrills: any[] = [];
		for (let i = startIndex; i < endIndex && i < filteredDrills.length; i++) {
			const drill = filteredDrills[i];
			if (drill && isDrillCached(drill.id)) {
				cachedPageDrills.push(getCachedDrill(drill.id));
			} else if (drill) {
				cachedPageDrills.push(drill);
			}
		}
		
		// Cache any new drills
		cacheDrills(cachedPageDrills);
		
		setDisplayedDrills(prev => [...prev, ...cachedPageDrills]);
		setCurrentPage(nextPage);
		setHasMoreDrills(endIndex < filteredDrills.length);
		setIsLoadingMore(false);
	};

	const cacheDrills = (drillsToCache: any[]) => {
		const newCache = new Map(drillCache);
		const newCachedIds = new Set(cachedDrillIds);
		
		drillsToCache.forEach((drill: any) => {
			if (drill && drill.id) {
				newCache.set(drill.id, drill);
				newCachedIds.add(drill.id);
			}
		});
		
		setDrillCache(newCache);
		setCachedDrillIds(newCachedIds);
	};

	const getCachedDrill = (drillId: string) => {
		return drillCache.get(drillId);
	};

	const isDrillCached = (drillId: string) => {
		return cachedDrillIds.has(drillId);
	};

	const filterDrills = (drillsToFilter: any[]) => {
		if (
			selectedFilters.skillFocus.length === 0 &&
			selectedFilters.difficulty.length === 0 &&
			selectedFilters.type.length === 0
		) {
			return drillsToFilter;
		}

		return drillsToFilter.filter((drill: any) => {
			let drillSkillFocus = [];
			let drillDifficulty = [];
			let drillType = [];

			if (drill.skillFocus) {
				if (typeof drill.skillFocus === "string") {
					try {
						const parsed = JSON.parse(drill.skillFocus);
						drillSkillFocus = Array.isArray(parsed)
							? parsed.map((s) => s.toLowerCase())
							: [drill.skillFocus.toLowerCase()];
					} catch {
						drillSkillFocus = [drill.skillFocus.toLowerCase()];
					}
				}
			}

			if (drill.difficulty) {
				if (typeof drill.difficulty === "string") {
					try {
						const parsed = JSON.parse(drill.difficulty);
						drillDifficulty = Array.isArray(parsed)
							? parsed.map((d) => d.toLowerCase())
							: [drill.difficulty.toLowerCase()];
					} catch {
						drillDifficulty = [drill.difficulty.toLowerCase()];
					}
				}
			}

			if (drill.type) {
				if (typeof drill.type === "string") {
					try {
						const parsed = JSON.parse(drill.type);
						drillType = Array.isArray(parsed)
							? parsed.map((t) => t.toLowerCase())
							: [drill.type.toLowerCase()];
					} catch {
						drillType = [drill.type.toLowerCase()];
					}
				}
			}

			const skillFocusMatch =
				selectedFilters.skillFocus.length === 0 ||
				selectedFilters.skillFocus.every((filter) =>
					drillSkillFocus.includes(filter.toLowerCase())
				);

			const difficultyMatch =
				selectedFilters.difficulty.length === 0 ||
				selectedFilters.difficulty.every((filter) =>
					drillDifficulty.includes(filter.toLowerCase())
				);

			const typeMatch =
				selectedFilters.type.length === 0 ||
				selectedFilters.type.every((filter) =>
					drillType.includes(filter.toLowerCase())
				);

			return skillFocusMatch && difficultyMatch && typeMatch;
		});
	};

	// Apply search filter
	const searchFilteredDrills = drills.filter((drill) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			drill.name?.toLowerCase().includes(query) ||
			drill.notes?.toLowerCase().includes(query)
		);
	});

	const filteredDrills = filterDrills(searchFilteredDrills);

	// Handle pagination, caching, and preloading in a single useEffect
	useEffect(() => {
		if (drills.length > 0) {
			// Aggressive preloading: cache all available drills in background
			const allDrills = drills.slice(0, Math.min(drills.length, DRILLS_PER_PAGE * 10)); // Cache up to 10 pages
			cacheDrills(allDrills);
			
			// If we don't have displayed drills yet, show first page immediately
			if (displayedDrills.length === 0) {
				const firstPage = drills.slice(0, DRILLS_PER_PAGE);
				setDisplayedDrills(firstPage);
				setCurrentPage(1);
				setHasMoreDrills(drills.length > DRILLS_PER_PAGE);
			}
		}
	}, [drills, displayedDrills.length]);

	// Handle filtered drills changes separately
	useEffect(() => {
		// Check if the filtered drills have actually changed
		const currentDrills = JSON.stringify(filteredDrills.map(d => d.id).sort());
		const prevDrills = JSON.stringify(prevFilteredDrillsRef.current.map(d => d.id).sort());
		
		if (currentDrills !== prevDrills) {
			prevFilteredDrillsRef.current = [...filteredDrills];
			
			if (filteredDrills.length > 0) {
				// Reset pagination when filters change
				setCurrentPage(1);
				setHasMoreDrills(filteredDrills.length > DRILLS_PER_PAGE);
				
				// Show first page immediately and cache it
				const firstPage = filteredDrills.slice(0, DRILLS_PER_PAGE);
				cacheDrills(firstPage);
				setDisplayedDrills(firstPage);
			} else {
				setDisplayedDrills([]);
				setHasMoreDrills(false);
			}
		}
	}, [filteredDrills]);

	// No categorization - just use filtered drills directly

	const renderDrillRow = (drill: any) => {
		let drillSkillFocus = [];
		let drillDifficulty = [];
		let drillType = [];

		// Parse skillFocus
		if (drill.skillFocus) {
			try {
				const parsed = JSON.parse(drill.skillFocus);
				drillSkillFocus = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				drillSkillFocus = [drill.skillFocus];
			}
		}

		// Parse difficulty
		if (drill.difficulty) {
			try {
				const parsed = JSON.parse(drill.difficulty);
				drillDifficulty = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				drillDifficulty = [drill.difficulty];
			}
		}

		// Parse type
		if (drill.type) {
			try {
				const parsed = JSON.parse(drill.type);
				drillType = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				drillType = [drill.type];
			}
		}

		return (
			<DrillCard 
				key={drill.id}
				drill={drill}
				showStarButton={true}
				showClipboardButton={true}
				onRefresh={refreshDrills}
				showAdminActions={true}
			/>
		);
	};


	if (!isSubscriber) {
		return (
			<SafeAreaProvider>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.container}>
						<View style={styles.centeredContainer}>
							<UpgradeToPremiumBanner role="free" />
						</View>
					</View>
				</SafeAreaView>
			</SafeAreaProvider>
		);
	}


	return (
		
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>	
					{/* Search Bar */}
					<View style={styles.searchContainer}>
						<View style={styles.searchInputContainer}>
							<MaterialIcons
								name="search"
								size={20}
								color="#94A3B8"
								style={styles.searchIcon}
							/>
							<TextInput
								style={styles.searchInput}
								placeholder="Search drills..."
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholderTextColor="#94A3B8"
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
										color="#94A3B8"
									/>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								onPress={() => setShowFilters(true)}
								style={[
									styles.filterButton,
									(selectedFilters.skillFocus.length > 0 ||
										selectedFilters.difficulty.length > 0 ||
										selectedFilters.type.length > 0) && styles.filterButtonActive
								]}
							>
								<MaterialIcons
									name="filter-list"
									size={20}
									color={
										(selectedFilters.skillFocus.length > 0 ||
											selectedFilters.difficulty.length > 0 ||
											selectedFilters.type.length > 0) 
											? "#FFFFFF"
											: "#94A3B8"
									}
								/>
								{(selectedFilters.skillFocus.length > 0 ||
									selectedFilters.difficulty.length > 0 ||
									selectedFilters.type.length > 0) && (
									<View style={styles.filterBadge} />
								)}
							</TouchableOpacity>
						</View>
					</View>

					{/* Active filters */}
					{(selectedFilters.skillFocus.length > 0 ||
						selectedFilters.difficulty.length > 0 ||
						selectedFilters.type.length > 0) && (
						<View style={styles.activeFiltersContainer}>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
							>
								{[
									...selectedFilters.skillFocus,
									...selectedFilters.difficulty,
									...selectedFilters.type,
								].map((filter, index) => (
									<View
										key={index}
										style={styles.activeFilter}
									>
										<Text style={styles.activeFilterText}>
											{filter}
										</Text>
										<TouchableOpacity
											onPress={() => {
												if (
													selectedFilters.skillFocus.includes(
														filter
													)
												) {
													toggleFilter(
														"skillFocus",
														filter
													);
												} else if (
													selectedFilters.difficulty.includes(
														filter
													)
												) {
													toggleFilter(
														"difficulty",
														filter
													);
												} else {
													toggleFilter(
														"type",
														filter
													);
												}
											}}
											style={styles.removeFilterButton}
										>
											<MaterialIcons
												name="close"
												size={16}
												color={theme.colors.white}
											/>
										</TouchableOpacity>
									</View>
								))}
							</ScrollView>
						</View>
					)}
					<ScrollView 
						contentContainerStyle={styles.scrollView}
						onScroll={({ nativeEvent }) => {
							const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
							const paddingToBottom = 20;
							if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
								loadMoreDrills();
							}
						}}
						scrollEventThrottle={400}
					>
						<Text style={styles.header}>
							All Drills ({filteredDrills.length})
						</Text>
						{displayedDrills.map(renderDrillRow)}
						
						{/* Load More Indicator */}
						{hasMoreDrills && (
							<View style={styles.loadMoreContainer}>
								{isLoadingMore ? (
									<View style={styles.loadingMoreContainer}>
										<ActivityIndicator size="small" color={theme.colors.primary} />
										<Text style={styles.loadingMoreText}>Loading more drills...</Text>
									</View>
								) : (
									<TouchableOpacity
										style={styles.loadMoreButton}
										onPress={loadMoreDrills}
									>
										<Text style={styles.loadMoreButtonText}>Load More Drills</Text>
									</TouchableOpacity>
								)}
							</View>
						)}
						
						{displayedDrills.length === 0 && (
							<View style={styles.emptyState}>
								<MaterialIcons
									name="search-off"
									size={48}
									color="#ccc"
								/>
								<Text style={styles.emptyStateText}>
									No drills match your filters
								</Text>
								<TouchableOpacity
									onPress={clearAllFilters}
									style={styles.clearFiltersButton}
								>
									<Text style={styles.clearFiltersButtonText}>
										Clear Filters
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</ScrollView>
					<DrillFilterModal
				visible={showFilters}
				onClose={() => setShowFilters(false)}
				selectedFilters={selectedFilters}
				skillFocusOptions={skillFocusOptions}
				difficultyOptions={difficultyOptions}
				typeOptions={typeOptions}
				toggleFilter={toggleFilter}
				clearAllFilters={clearAllFilters}
				filteredCount={filteredDrills.length}
			/>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	container: {
		flex: 1,
		position: "relative",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: theme.colors.textMuted,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: theme.colors.error,
		textAlign: "center",
		marginVertical: 16,
	},
	retryButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: "600",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 100,
	},
	header: {
		fontSize: 26,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginVertical: 12,
	},
	section: {
		marginBottom: 24,
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
	drillCard: {
		backgroundColor: theme.colors.surface,
	},
	loadMoreContainer: {
		marginTop: 20,
		marginBottom: 20,
		alignItems: 'center',
	},
	loadingMoreContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	loadingMoreText: {
		fontSize: 16,
		color: theme.colors.textMuted,
	},
	loadMoreButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	loadMoreButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: '600',
	},

	drillCardContent: {
		flex: 1,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	drillTextContainer: {
		flex: 1,
	},
	drillTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	drillNotes: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginBottom: 8,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
	},
	tag: {
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginRight: 6,
		marginBottom: 4,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	skillTag: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.primary,
		borderWidth: 1,
	},
	difficultyTag: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.accent,
		borderWidth: 1,
	},
	typeTag: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.secondary,
		borderWidth: 1,
	},
	tagText: {
		fontSize: 12,
		color: theme.colors.white,
		fontWeight: "500",
	},
	moreTagsText: {
		fontSize: 12,
		color: theme.colors.textMuted,
		fontStyle: "italic",
	},
	arrowIcon: {
		marginLeft: 12,
	},
	starButtonStyle: {
		paddingHorizontal: 8,
		paddingVertical: 16,
	},
	fab: {
		position: "absolute",
		bottom: 24,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#007AFF",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
		zIndex: 10,
	},
	// Header styles
	headerButtons: {
		flexDirection: "row",
		alignItems: "center",
	},
	headerButton: {
		position: "relative",
		padding: 8,
		borderRadius: 8,
		backgroundColor: "#f8f9fa",
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	headerButtonActive: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	// Active filters styles
	activeFiltersContainer: {
		backgroundColor: theme.colors.surface,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	activeFilter: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
	},
	activeFilterText: {
		fontSize: 14,
		color: theme.colors.white,
		fontWeight: "500",
		marginRight: 4,
	},
	removeFilterButton: {
		padding: 2,
	},
	// Empty state styles
	emptyState: {
		alignItems: "center",
		paddingVertical: 48,
	},
	emptyStateText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginTop: 16,
		marginBottom: 24,
	},
	clearFiltersButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	clearFiltersButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: "600",
	},
	// Clipboard button styles
	actionButtonsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	clipboardButton: {
		padding: 8,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: theme.colors.primary,
		backgroundColor: "transparent",
	},
	clipboardButtonActive: {
		backgroundColor: theme.colors.primary,
	},
	// Search styles
	searchContainer: {
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	searchInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.background,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: theme.colors.border,
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
	centeredContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
});
