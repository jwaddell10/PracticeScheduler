import React, { useState, useLayoutEffect, useContext, useEffect } from "react";
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
import theme from "./styles/theme";
// import theme from "./styles/theme";

export default function Drills() {
	const navigation = useNavigation();
	const { publicDrills: drills, loading, error, refreshAllDrills: refreshDrills } = useDrills();
	console.log(drills, 'drills')
	const { favoriteDrillIds, handleFavoriteToggle } = useFavorites();

	const [showFilters, setShowFilters] = useState(false);
	const [selectedFilters, setSelectedFilters] = useState({
		skillFocus: [],
		difficulty: [],
		type: [],
	});
	const [searchQuery, setSearchQuery] = useState("");

	const skillFocusOptions = [
		"Offense",
		"Defense",
		"Serve",
		"Serve Receive",
		"Blocking",
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

	if (error) {
		return (
			<SafeAreaProvider>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.errorContainer}>
						<MaterialIcons name="error" size={48} color="#ff4444" />
						<Text style={styles.errorText}>
							Error loading drills: {error}
						</Text>
						<TouchableOpacity
							style={styles.retryButton}
							onPress={refreshDrills}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				</SafeAreaView>
			</SafeAreaProvider>
		);
	}

	const toggleFilter = (filterType, value) => {
		setSelectedFilters((prev) => {
			const currentFilters = prev[filterType];
			const newFilters = currentFilters.includes(value)
				? currentFilters.filter((f) => f !== value)
				: [...currentFilters, value];
			return { ...prev, [filterType]: newFilters };
		});
	};

	const clearAllFilters = () => {
		setSelectedFilters({ skillFocus: [], difficulty: [], type: [] });
	};

	const filterDrills = (drillsToFilter) => {
		if (
			selectedFilters.skillFocus.length === 0 &&
			selectedFilters.difficulty.length === 0 &&
			selectedFilters.type.length === 0
		) {
			return drillsToFilter;
		}

		return drillsToFilter.filter((drill) => {
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
				selectedFilters.skillFocus.some((filter) =>
					drillSkillFocus.includes(filter.toLowerCase())
				);

			const difficultyMatch =
				selectedFilters.difficulty.length === 0 ||
				selectedFilters.difficulty.some((filter) =>
					drillDifficulty.includes(filter.toLowerCase())
				);

			const typeMatch =
				selectedFilters.type.length === 0 ||
				selectedFilters.type.some((filter) =>
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

	const groupedDrills = filteredDrills.reduce(
		(acc, drill) => {
			// Parse the type to handle JSON arrays
			let drillType = [];
			if (drill.type) {
				if (typeof drill.type === "string") {
					try {
						const parsed = JSON.parse(drill.type);
						drillType = Array.isArray(parsed) ? parsed : [parsed];
					} catch {
						drillType = [drill.type];
					}
				}
			}

			// Determine if it's a team drill or individual drill
			const isTeamDrill = drillType.some((type) => 
				type.toLowerCase().includes("team")
			);
			
			const typeKey = isTeamDrill ? "team" : "individual";
			
			// Get all skill focuses for this drill
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
				if (!acc[typeKey][skillFocus]) {
					acc[typeKey][skillFocus] = [];
				}
				acc[typeKey][skillFocus].push(drill);
			});
			
			return acc;
		},
		{ team: {}, individual: {} }
	);

	const renderDrillRow = (drill) => {
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
			<View key={drill.id} style={styles.drillCard}>
				<TouchableOpacity
					style={styles.drillCardContent}
					onPress={() =>
						navigation.navigate("DrillDetails", { drill })
					}
					activeOpacity={0.7}
				>
					<View style={styles.drillTextContainer}>
						<Text style={styles.drillTitle}>{drill.name}</Text>
						{drill.notes ? (
							<Text style={styles.drillNotes} numberOfLines={2}>
								{drill.notes}
							</Text>
						) : null}

						{/* TAGS */}
						<View style={styles.tagsContainer}>
							{drillDifficulty.map((diff, idx) => (
								<View
									key={`diff-${idx}`}
									style={[styles.tag, styles.difficultyTag]}
								>
									<Text style={styles.tagText}>
										{diff.charAt(0).toUpperCase() +
											diff.slice(1)}
									</Text>
								</View>
							))}
							{drillSkillFocus.map((skill, idx) => (
								<View
									key={`skill-${idx}`}
									style={[styles.tag, styles.skillTag]}
								>
									<Text style={styles.tagText}>
										{skill.charAt(0).toUpperCase() +
											skill.slice(1)}
									</Text>
								</View>
							))}
							{drillType.map((t, idx) => (
								<View
									key={`type-${idx}`}
									style={[styles.tag, styles.typeTag]}
								>
									<Text style={styles.tagText}>
										{t.charAt(0).toUpperCase() + t.slice(1)}
									</Text>
								</View>
							))}
						</View>
					</View>
					<MaterialIcons
						name="arrow-forward-ios"
						size={20}
						color="#007AFF"
						style={styles.arrowIcon}
					/>
				</TouchableOpacity>
				<StarButton
					drillId={drill.id}
					initialIsFavorited={favoriteDrillIds.has(drill.id)}
					size={20}
					onToggle={(drillId, isFavorited) => {
						handleFavoriteToggle(drillId, isFavorited);
					}}
					style={styles.starButtonStyle}
				/>
			</View>
		);
	};

	const renderFilterModal = () => (
		<Modal
			visible={showFilters}
			animationType="slide"
			presentationStyle="pageSheet"
		>
			<SafeAreaView style={styles.modalContainer}>
				<View style={styles.modalHeader}>
					<TouchableOpacity onPress={() => setShowFilters(false)}>
						<Text style={styles.cancelButton}>Cancel</Text>
					</TouchableOpacity>
					<Text style={styles.modalTitle}>Filter Drills</Text>
					<TouchableOpacity onPress={clearAllFilters}>
						<Text style={styles.clearButton}>Clear All</Text>
					</TouchableOpacity>
				</View>
				<ScrollView style={styles.modalContent}>
					{/* Skill Focus */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>
							Skill Focus
						</Text>
						<View style={styles.filterOptionsContainer}>
							{skillFocusOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.skillFocus.includes(
											option
										) && styles.filterOptionSelected,
									]}
									onPress={() =>
										toggleFilter("skillFocus", option)
									}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.skillFocus.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.skillFocus.includes(
										option
									) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>
					{/* Difficulty */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>
							Difficulty
						</Text>
						<View style={styles.filterOptionsContainer}>
							{difficultyOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.difficulty.includes(
											option
										) && styles.filterOptionSelected,
									]}
									onPress={() =>
										toggleFilter("difficulty", option)
									}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.difficulty.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.difficulty.includes(
										option
									) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>
					{/* Type */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>Type</Text>
						<View style={styles.filterOptionsContainer}>
							{typeOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.type.includes(option) &&
											styles.filterOptionSelected,
									]}
									onPress={() => toggleFilter("type", option)}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.type.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.type.includes(option) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>
				</ScrollView>
				<View style={styles.modalFooter}>
					<TouchableOpacity
						style={styles.applyButton}
						onPress={() => setShowFilters(false)}
					>
						<Text style={styles.applyButtonText}>
							Apply Filters ({filteredDrills.length} drills)
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</Modal>
	);

	if (loading) {
		return (
			<SafeAreaProvider>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#007AFF" />
						<Text style={styles.loadingText}>
							Loading drills...
						</Text>
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
												color="#007AFF"
											/>
										</TouchableOpacity>
									</View>
								))}
							</ScrollView>
						</View>
					)}
					<ScrollView contentContainerStyle={styles.scrollView}>
						<Text style={styles.header}>
							Team Drills (
							{Object.values(groupedDrills.team).flat().length})
						</Text>
						{Object.entries(groupedDrills.team).map(
							([category, drills]) => (
								<View key={category} style={styles.section}>
									<Text style={styles.categoryTitle}>
										{category.replace(/\b\w/g, (c) =>
											c.toUpperCase()
										)}{" "}
										({drills.length})
									</Text>
									{drills.map(renderDrillRow)}
								</View>
							)
						)}
						<Text style={styles.header}>
							Individual Drills (
							{
								Object.values(groupedDrills.individual).flat()
									.length
							}
							)
						</Text>
						{Object.entries(groupedDrills.individual).map(
							([category, drills]) => (
								<View key={category} style={styles.section}>
									<Text style={styles.categoryTitle}>
										{category.replace(/\b\w/g, (c) =>
											c.toUpperCase()
										)}{" "}
										({drills.length})
									</Text>
									{drills.map(renderDrillRow)}
								</View>
							)
						)}
						{filteredDrills.length === 0 && (
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
					{renderFilterModal()}
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#0F172A",
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
		borderRadius: 12,
		marginBottom: 12,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: theme.colors.border,
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
	filterBadge: {
		position: "absolute",
		top: 2,
		right: 2,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#FF3B30",
	},
	// Active filters styles
	activeFiltersContainer: {
		backgroundColor: "#fff",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	activeFilter: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#e3f2fd",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
	},
	activeFilterText: {
		fontSize: 14,
		color: "#007AFF",
		fontWeight: "500",
		marginRight: 4,
	},
	removeFilterButton: {
		padding: 2,
	},
	// Modal styles
	modalContainer: {
		flex: 1,
		backgroundColor: "#fff",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#222",
	},
	cancelButton: {
		fontSize: 16,
		color: "#007AFF",
	},
	clearButton: {
		fontSize: 16,
		color: "#FF3B30",
	},
	modalContent: {
		flex: 1,
		padding: 16,
	},
	filterSection: {
		marginBottom: 32,
	},
	filterSectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#222",
		marginBottom: 16,
	},
	filterOptionsContainer: {
		gap: 8,
	},
	filterOption: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#f8f9fa",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#eee",
	},
	filterOptionSelected: {
		backgroundColor: "#e3f2fd",
		borderColor: "#007AFF",
	},
	filterOptionText: {
		fontSize: 16,
		color: "#222",
		fontWeight: "500",
	},
	filterOptionTextSelected: {
		color: "#007AFF",
	},
	modalFooter: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	applyButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	applyButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	// Empty state styles
	emptyState: {
		alignItems: "center",
		paddingVertical: 48,
	},
	emptyStateText: {
		fontSize: 16,
		color: "#666",
		marginTop: 16,
		marginBottom: 24,
	},
	clearFiltersButton: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	clearFiltersButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
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
		backgroundColor: "#14B8A6",
	},
	filterBadge: {
		position: "absolute",
		top: 2,
		right: 2,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#EF4444",
	},
});
