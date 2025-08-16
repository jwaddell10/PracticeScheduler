import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	FlatList,
	Image,
	TouchableOpacity,
	StyleSheet,
	Modal,
	TextInput,
	ScrollView,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";
import { useSession } from "../context/SessionContext";
import { useDrills } from "../context/DrillsContext";
import StarButton from "../components/StarButton";
import { useDrillFilters } from "../hooks/useDrillFilters";
import DrillFilterModal from "../components/DrillFilterModal";
import ActiveFiltersBar from "../components/ActiveFiltersBar";
import CreateDrill from "./CreateDrill";
import theme from "./styles/theme";
import DrillCard from "./DrillCard";
import { useUserRole } from "../hooks/useUserRole";

export default function YourDrills() {
	const {
		favoriteDrills,
		favoriteDrillIds,
		loading: favoritesLoading,
		error: favoritesError,
		handleFavoriteToggle,
	} = useFavorites();

	const {
		userDrills,
		loading: userDrillsLoading,
		error: userDrillsError,
		fetchUserDrills,
	} = useDrills();

	const session = useSession();
	const navigation = useNavigation();
	const { role } = useUserRole();
	const [showFilters, setShowFilters] = useState(false);
	const [showCreateDrill, setShowCreateDrill] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("myDrills"); // "myDrills" or "favorites"


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

	// Smart refresh on focus - only refresh if data is older than 30 seconds
	const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
	
	// Fetch user drills when component mounts
	useEffect(() => {
		fetchUserDrills();
	}, []);
	
	// Smart refresh on focus
	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			const now = Date.now();
			const timeSinceLastRefresh = now - lastRefreshTime;
			
			// Only refresh if it's been more than 30 seconds since last refresh
			if (timeSinceLastRefresh > 30000) {
				fetchUserDrills();
				setLastRefreshTime(now);
			}
		});
		return unsubscribe;
	}, [navigation, fetchUserDrills, lastRefreshTime]);

	// Refresh drills after creation
	const refreshDrills = () => {
		fetchUserDrills();
		setLastRefreshTime(Date.now());
	};



	// Combine user's own drills and favorites based on active tab
	const combineDrills = () => {
		const combined = [];
		const seenIds = new Set();

		if (activeTab === "myDrills") {
			// Show only user's created drills
			if (userDrills) {
				userDrills.forEach((drill) => {
					if (drill.user_id === session?.user?.id) {
						combined.push({
							...drill,
							isFavorited: favoriteDrillIds.has(drill.id),
							isUserDrill: true,
						});
						seenIds.add(drill.id);
					}
				});
			}
		} else if (activeTab === "favorites" && (role === "admin" || role === "premium")) {
			// Show only favorited drills from drill library (for premium/admin users)
			if (favoriteDrills) {
				favoriteDrills.forEach((drill) => {
					if (
						drill.user_id !== session?.user?.id &&
						!seenIds.has(drill.id)
					) {
						combined.push({
							...drill,
							isFavorited: true,
							isUserDrill: false,
						});
						seenIds.add(drill.id);
					}
				});
			}
		}

		return combined;
	};

	const combinedDrills = combineDrills();
	const filteredDrills = filterDrills(combinedDrills || []);

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

	// Organize drills by type and skill focus
	const organizeDrills = (drills) => {
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

	const organizedDrills = organizeDrills(searchFilteredDrills);
	
	// Reorder to show team drills first
	const reorderedDrills = {};
	if (organizedDrills.team) {
		reorderedDrills.team = organizedDrills.team;
	}
	if (organizedDrills.individual) {
		reorderedDrills.individual = organizedDrills.individual;
	}

	const loading = favoritesLoading || userDrillsLoading;
	const error = favoritesError || userDrillsError;

	// Remove header filter button since we'll add it to search bar
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => null,
		});
	}, [navigation]);

	const formatArrayValue = (value) => {
		if (
			typeof value === "string" &&
			value.startsWith("[") &&
			value.endsWith("]")
		) {
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					return parsed
						.map((item) =>
							typeof item === "string"
								? item.charAt(0).toUpperCase() +
								  item.slice(1).toLowerCase()
								: item
						)
						.join(", ");
				}
			} catch {}
		}
		if (Array.isArray(value)) {
			return value
				.map((item) =>
					typeof item === "string"
						? item.charAt(0).toUpperCase() +
						  item.slice(1).toLowerCase()
						: item
				)
				.join(", ");
		}
		if (typeof value === "string" && value.trim() !== "") {
			return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
		}
		return "Not specified";
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007AFF" />
				<Text style={styles.loadingText}>Loading your drills...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.errorContainer}>
				<MaterialIcons name="error" size={48} color="#ff4444" />
				<Text style={styles.errorText}>Error: {error}</Text>
			</View>
		);
	}

	const renderDrill = ({ item }) => {
		return (
							<DrillCard
					key={item.id}
					drill={item}
					showStarButton={true}
					showClipboardButton={true}
					showStarOnlyIfFavorited={true}
					onRefresh={refreshDrills}
				/>
		);
	};

	const renderEmptyFiltered = () => (
		<View style={styles.emptyFilteredContainer}>
			<MaterialIcons name="search-off" size={48} color="#ccc" />
			<Text style={styles.emptyFilteredText}>
				No drills match your filters
			</Text>
			<TouchableOpacity
				onPress={clearAllFilters}
				style={styles.clearFiltersButton}
			>
				<Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.container}>
			<ActiveFiltersBar
				selectedFilters={selectedFilters}
				toggleFilter={toggleFilter}
				hasActiveFilters={hasActiveFilters}
			/>

			{/* Tab Toggle */}
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[
						styles.tabButton,
						activeTab === "myDrills" && styles.activeTabButton
					]}
					onPress={() => setActiveTab("myDrills")}
				>
					<Text style={[
						styles.tabButtonText,
						activeTab === "myDrills" && styles.activeTabButtonText
					]}>
						My Drills
					</Text>
				</TouchableOpacity>
				{(role === "admin" || role === "premium") && (
					<TouchableOpacity
						style={[
							styles.tabButton,
							activeTab === "favorites" && styles.activeTabButton
						]}
						onPress={() => setActiveTab("favorites")}
					>
						<Text style={[
							styles.tabButtonText,
							activeTab === "favorites" && styles.activeTabButtonText
						]}>
							Favorites
						</Text>
					</TouchableOpacity>
				)}
			</View>

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
						placeholder="Search your drills..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor={theme.colors.textMuted}
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
						onPress={() => setShowFilters(true)}
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
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
			>
				<View style={styles.headerContainer}>
					<Text style={styles.headerTitle}>
						{activeTab === "myDrills" ? "My Drills" : "Favorites"} ({searchFilteredDrills.length}
						{(hasActiveFilters() || searchQuery.trim() !== "") &&
							` of ${combinedDrills.length}`}
						)
					</Text>
				</View>

				{Object.keys(reorderedDrills).length === 0 ? (
					hasActiveFilters() || searchQuery.trim() !== "" ? renderEmptyFiltered : null
				) : (
					Object.entries(reorderedDrills).map(([type, skillFocusGroups]) => (
						<View key={type} style={styles.section}>
							<Text style={styles.header}>
								{type.replace(/\b\w/g, (c) => c.toUpperCase())} Drills (
								{Object.values(skillFocusGroups).flat().length})
							</Text>
							{Object.entries(skillFocusGroups).map(([skillFocus, drills]) => (
								<View key={`${type}-${skillFocus}`} style={styles.section}>
									<Text style={styles.categoryTitle}>
										{skillFocus.replace(/\b\w/g, (c) => c.toUpperCase())} ({drills.length})
									</Text>
									{drills.map((drill) => (
										<View key={drill.id}>
											{renderDrill({ item: drill })}
										</View>
									))}
								</View>
							))}
						</View>
					))
				)}
			</ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity
				style={styles.fab}
				onPress={() => setShowCreateDrill(true)}
			>
				<MaterialIcons name="add" size={28} color="#fff" />
			</TouchableOpacity>

			{/* Create Drill Modal */}
			<Modal
				visible={showCreateDrill}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowCreateDrill(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							onPress={() => setShowCreateDrill(false)}
							style={styles.modalCloseButton}
						>
							<Text style={styles.closeButtonText}>✕</Text>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>Create Drill</Text>
						<View style={{ width: 24 }} />
					</View>
					<CreateDrill
						refreshDrills={() => {
							refreshDrills();
							setShowCreateDrill(false);
						}}
						onClose={() => setShowCreateDrill(false)}
						isModal={true}
					/>
				</View>
			</Modal>

			<DrillFilterModal
				visible={showFilters}
				onClose={() => setShowFilters(false)}
				selectedFilters={selectedFilters}
				skillFocusOptions={skillFocusOptions}
				difficultyOptions={difficultyOptions}
				typeOptions={typeOptions}
				toggleFilter={toggleFilter}
				clearAllFilters={clearAllFilters}
				filteredCount={searchFilteredDrills.length}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: theme.colors.background },
	tabContainer: {
		flexDirection: "row",
		marginHorizontal: 16,
		marginVertical: 12,
		backgroundColor: theme.colors.surface,
		borderRadius: 8,
		padding: 4,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 6,
		alignItems: "center",
	},
	activeTabButton: {
		backgroundColor: theme.colors.primary,
	},
	tabButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.textMuted,
	},
	activeTabButtonText: {
		color: theme.colors.white,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: { marginTop: 10, fontSize: 16, color: theme.colors.textMuted },
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		marginTop: 10,
		fontSize: 16,
		color: theme.colors.error,
		textAlign: "center",
	},
	headerButton: {
		padding: 8,
		borderRadius: 20,
		backgroundColor: theme.colors.surface,
		position: "relative",
	},
	filterBadge: {
		position: "absolute",
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: theme.colors.error,
	},
	scrollView: {
		flex: 1,
	},
	listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 80 }, // leave space for FAB
	headerContainer: { paddingVertical: 16 },
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
	headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary },
	header: {
		fontSize: 26,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginVertical: 12,
	},
	drillCard: {
		flexDirection: "row",
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		marginBottom: 16,
		elevation: 2,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	drillImage: { width: 100, height: 120, backgroundColor: theme.colors.border },
	placeholderImage: { justifyContent: "center", alignItems: "center" },
	drillContent: { flex: 1, padding: 12 },
	drillHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	titleContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-start",
		marginRight: 8,
	},
	favoriteIcon: { marginRight: 4, marginTop: 2 },
	drillTitle: {
		flex: 1,
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		lineHeight: 20,
	},
	badgeContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		marginRight: 8,
	},
	publicBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	publicBadgeText: {
		fontSize: 10,
		color: theme.colors.white,
		fontWeight: "500",
		marginLeft: 2,
	},
	adminBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	adminBadgeText: {
		fontSize: 10,
		color: theme.colors.white,
		fontWeight: "500",
		marginLeft: 2,
	},
	myDrillBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.accent,
	},
	myDrillBadgeText: {
		fontSize: 10,
		color: theme.colors.white,
		fontWeight: "500",
		marginLeft: 2,
	},
	starButton: { padding: 4 },
	drillInfo: { flex: 1 },
	infoRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 4,
	},
	infoLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textMuted, minWidth: 60 },
	infoText: { flex: 1, fontSize: 12, color: theme.colors.textPrimary },
	notesContainer: { marginTop: 4 },
	notesText: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 16, marginTop: 2 },
	emptyFilteredContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	emptyFilteredText: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textMuted,
		marginTop: 16,
		textAlign: "center",
	},
	clearFiltersButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 16,
	},
	clearFiltersButtonText: { color: theme.colors.white, fontSize: 14, fontWeight: "600" },
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
	fab: {
		position: "absolute",
		bottom: 20,
		right: 20,
		backgroundColor: theme.colors.primary,
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		elevation: 5,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
	},
	modalContainer: { flex: 1, backgroundColor: theme.colors.background },
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
	},
	modalTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary },
	modalCloseButton: { padding: 4 },
	closeButtonText: { 
		fontSize: 20, 
		color: theme.colors.primary, 
		fontWeight: "500" 
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
});
