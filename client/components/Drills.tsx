import React, { useEffect, useState, useLayoutEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Modal,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";

export default function Drills() {
	const navigation = useNavigation();
	const [drills, setDrills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedFilters, setSelectedFilters] = useState({
		skillFocus: [],
		difficulty: [],
		type: []
	});

	// Filter options
	const skillFocusOptions = ['Offense', 'Defense', 'Serve', 'Serve Receive', 'Blocking'];
	const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
	const typeOptions = ['Team Drill', 'Individual'];

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={styles.headerButtons}>
					<TouchableOpacity
						onPress={() => setShowFilters(true)}
						style={styles.headerButton}
					>
						<MaterialIcons
							name="filter-list"
							size={24}
							color="#007AFF"
						/>
						{(selectedFilters.skillFocus.length > 0 || selectedFilters.difficulty.length > 0 || selectedFilters.type.length > 0) && (
							<View style={styles.filterBadge} />
						)}
					</TouchableOpacity>
					<MaterialIcons
						name="add"
						size={28}
						color="#007AFF"
						style={{ marginRight: 16, marginLeft: 8 }}
						onPress={() => navigation.navigate("CreateDrill")}
					/>
				</View>
			),
		});
	}, [navigation, selectedFilters]);

	useEffect(() => {
		fetchDrills();
	}, []);

	const fetchDrills = async () => {
		const localIP = Constants.expoConfig?.extra?.localIP;
		const PORT = Constants.expoConfig?.extra?.PORT;
		setLoading(true);
		try {
			const response = await fetch(`http://${localIP}:${PORT}/drill`);
			if (!response.ok) {
				throw new Error(`HTTP Status error! ${response.status}`);
			}
			const data = await response.json();
			setDrills(data);
			setLoading(false);
		} catch (error) {
			console.log(error, "err");
		}
	};

	const toggleFilter = (filterType, value) => {
		setSelectedFilters(prev => {
			const currentFilters = prev[filterType];
			const newFilters = currentFilters.includes(value)
				? currentFilters.filter(f => f !== value)
				: [...currentFilters, value];
			
			return {
				...prev,
				[filterType]: newFilters
			};
		});
	};

	const clearAllFilters = () => {
		setSelectedFilters({
			skillFocus: [],
			difficulty: [],
			type: []
		});
	};

	const filterDrills = (drillsToFilter) => {
		if (selectedFilters.skillFocus.length === 0 && selectedFilters.difficulty.length === 0 && selectedFilters.type.length === 0) {
			return drillsToFilter;
		}

		return drillsToFilter.filter(drill => {
			// Parse data - handle both JSON string arrays and plain strings
			let drillSkillFocus = [];
			let drillDifficulty = [];
			let drillType = [];
			
			// Handle skillFocus
			if (drill.skillFocus) {
				if (typeof drill.skillFocus === 'string') {
					try {
						// Try parsing as JSON array first
						const parsed = JSON.parse(drill.skillFocus);
						drillSkillFocus = Array.isArray(parsed) ? parsed.map(s => s.toLowerCase()) : [drill.skillFocus.toLowerCase()];
					} catch (e) {
						// If parsing fails, treat as plain string
						drillSkillFocus = [drill.skillFocus.toLowerCase()];
					}
				}
			}
			
			// Handle difficulty
			if (drill.difficulty) {
				if (typeof drill.difficulty === 'string') {
					try {
						// Try parsing as JSON array first
						const parsed = JSON.parse(drill.difficulty);
						drillDifficulty = Array.isArray(parsed) ? parsed.map(d => d.toLowerCase()) : [drill.difficulty.toLowerCase()];
					} catch (e) {
						// If parsing fails, treat as plain string
						drillDifficulty = [drill.difficulty.toLowerCase()];
					}
				}
			}

			// Handle type
			if (drill.type) {
				if (typeof drill.type === 'string') {
					try {
						// Try parsing as JSON array first
						const parsed = JSON.parse(drill.type);
						drillType = Array.isArray(parsed) ? parsed.map(t => t.toLowerCase()) : [drill.type.toLowerCase()];
					} catch (e) {
						// If parsing fails, treat as plain string
						drillType = [drill.type.toLowerCase()];
					}
				}
			}

			const skillFocusMatch = selectedFilters.skillFocus.length === 0 || 
				selectedFilters.skillFocus.some(filter => 
					drillSkillFocus.includes(filter.toLowerCase())
				);

			const difficultyMatch = selectedFilters.difficulty.length === 0 || 
				selectedFilters.difficulty.some(filter => 
					drillDifficulty.includes(filter.toLowerCase())
				);

			const typeMatch = selectedFilters.type.length === 0 || 
				selectedFilters.type.some(filter => 
					drillType.includes(filter.toLowerCase())
				);

			return skillFocusMatch && difficultyMatch && typeMatch;
		});
	};

	const filteredDrills = filterDrills(drills);

	const groupedDrills = filteredDrills.reduce(
		(acc, drill) => {
			const typeKey =
				drill.type?.toLowerCase() === "team" ? "team" : "individual";
			const categoryKey =
				drill.category?.toLowerCase() || "uncategorized";

			if (!acc[typeKey][categoryKey]) {
				acc[typeKey][categoryKey] = [];
			}
			acc[typeKey][categoryKey].push(drill);
			return acc;
		},
		{ team: {}, individual: {} }
	);

	const renderDrillRow = (drill) => (
		<TouchableOpacity
			key={drill.id}
			style={styles.drillCard}
			onPress={() => navigation.navigate("DrillDetails", { drill })}
			activeOpacity={0.7}
		>
			<View style={styles.drillTextContainer}>
				<Text style={styles.drillTitle}>{drill.name}</Text>
				{drill.notes ? (
					<Text style={styles.drillNotes} numberOfLines={2}>
						{drill.notes}
					</Text>
				) : null}
				{/* Display tags if available */}
				{(drill.skillFocus || drill.difficulty || drill.type) && (
					<View style={styles.tagsContainer}>
						{/* Show skill focus tags */}
						{drill.skillFocus && (() => {
							try {
								// Try parsing as JSON array first
								let skillFocusArray;
								try {
									const parsed = JSON.parse(drill.skillFocus);
									skillFocusArray = Array.isArray(parsed) ? parsed : [drill.skillFocus];
								} catch (e) {
									// If parsing fails, treat as plain string
									skillFocusArray = [drill.skillFocus];
								}
								
								return skillFocusArray.slice(0, 2).map((skill, index) => (
									<View key={`skill-${index}`} style={[styles.tag, styles.skillTag]}>
										<Text style={styles.tagText}>{skill}</Text>
									</View>
								));
							} catch (e) {
								return null;
							}
						})()}
						
						{/* Show difficulty tags */}
						{drill.difficulty && (() => {
							try {
								// Try parsing as JSON array first
								let difficultyArray;
								try {
									const parsed = JSON.parse(drill.difficulty);
									difficultyArray = Array.isArray(parsed) ? parsed : [drill.difficulty];
								} catch (e) {
									// If parsing fails, treat as plain string
									difficultyArray = [drill.difficulty];
								}
								
								return difficultyArray.slice(0, 1).map((diff, index) => (
									<View key={`diff-${index}`} style={[styles.tag, styles.difficultyTag]}>
										<Text style={styles.tagText}>{diff}</Text>
									</View>
								));
							} catch (e) {
								return null;
							}
						})()}
						
						{/* Show type tags */}
						{drill.type && (() => {
							try {
								// Try parsing as JSON array first
								let typeArray;
								try {
									const parsed = JSON.parse(drill.type);
									typeArray = Array.isArray(parsed) ? parsed : [drill.type];
								} catch (e) {
									// If parsing fails, treat as plain string
									typeArray = [drill.type];
								}
								
								return typeArray.slice(0, 1).map((type, index) => (
									<View key={`type-${index}`} style={[styles.tag, styles.typeTag]}>
										<Text style={styles.tagText}>{type}</Text>
									</View>
								));
							} catch (e) {
								return null;
							}
						})()}
						
						{/* Show more indicator if there are many tags */}
						{(() => {
							try {
								// Calculate total tags handling both formats
								let skillCount = 0, diffCount = 0, typeCount = 0;
								
								if (drill.skillFocus) {
									try {
										const parsed = JSON.parse(drill.skillFocus);
										skillCount = Array.isArray(parsed) ? parsed.length : 1;
									} catch (e) {
										skillCount = 1;
									}
								}
								
								if (drill.difficulty) {
									try {
										const parsed = JSON.parse(drill.difficulty);
										diffCount = Array.isArray(parsed) ? parsed.length : 1;
									} catch (e) {
										diffCount = 1;
									}
								}
								
								if (drill.type) {
									try {
										const parsed = JSON.parse(drill.type);
										typeCount = Array.isArray(parsed) ? parsed.length : 1;
									} catch (e) {
										typeCount = 1;
									}
								}
								
								const totalShown = Math.min(2, skillCount) + Math.min(1, diffCount) + Math.min(1, typeCount);
								const totalTags = skillCount + diffCount + typeCount;
								
								if (totalTags > totalShown) {
									return (
										<Text style={styles.moreTagsText}>+{totalTags - totalShown}</Text>
									);
								}
								return null;
							} catch (e) {
								return null;
							}
						})()}
					</View>
				)}
			</View>
			<MaterialIcons
				name="arrow-forward-ios"
				size={20}
				color="#007AFF"
				style={styles.arrowIcon}
			/>
		</TouchableOpacity>
	);

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
					{/* Skill Focus Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>Skill Focus</Text>
						<View style={styles.filterOptionsContainer}>
							{skillFocusOptions.map(option => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.skillFocus.includes(option) && styles.filterOptionSelected
									]}
									onPress={() => toggleFilter('skillFocus', option)}
								>
									<Text style={[
										styles.filterOptionText,
										selectedFilters.skillFocus.includes(option) && styles.filterOptionTextSelected
									]}>
										{option}
									</Text>
									{selectedFilters.skillFocus.includes(option) && (
										<MaterialIcons name="check" size={20} color="#007AFF" />
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Difficulty Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>Difficulty</Text>
						<View style={styles.filterOptionsContainer}>
							{difficultyOptions.map(option => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.difficulty.includes(option) && styles.filterOptionSelected
									]}
									onPress={() => toggleFilter('difficulty', option)}
								>
									<Text style={[
										styles.filterOptionText,
										selectedFilters.difficulty.includes(option) && styles.filterOptionTextSelected
									]}>
										{option}
									</Text>
									{selectedFilters.difficulty.includes(option) && (
										<MaterialIcons name="check" size={20} color="#007AFF" />
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>
					{/* Type Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>Type</Text>
						<View style={styles.filterOptionsContainer}>
							{typeOptions.map(option => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.type.includes(option) && styles.filterOptionSelected
									]}
									onPress={() => toggleFilter('type', option)}
								>
									<Text style={[
										styles.filterOptionText,
										selectedFilters.type.includes(option) && styles.filterOptionTextSelected
									]}>
										{option}
									</Text>
									{selectedFilters.type.includes(option) && (
										<MaterialIcons name="check" size={20} color="#007AFF" />
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
					<ActivityIndicator size="large" color="#007AFF" />
				</SafeAreaView>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>
					{/* Active filters display */}
					{(selectedFilters.skillFocus.length > 0 || selectedFilters.difficulty.length > 0 || selectedFilters.type.length > 0) && (
						<View style={styles.activeFiltersContainer}>
							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								{[...selectedFilters.skillFocus, ...selectedFilters.difficulty, ...selectedFilters.type].map((filter, index) => (
									<View key={index} style={styles.activeFilter}>
										<Text style={styles.activeFilterText}>{filter}</Text>
										<TouchableOpacity
											onPress={() => {
												if (selectedFilters.skillFocus.includes(filter)) {
													toggleFilter('skillFocus', filter);
												} else if (selectedFilters.difficulty.includes(filter)) {
													toggleFilter('difficulty', filter);
												} else {
													toggleFilter('type', filter);
												}
											}}
											style={styles.removeFilterButton}
										>
											<MaterialIcons name="close" size={16} color="#007AFF" />
										</TouchableOpacity>
									</View>
								))}
							</ScrollView>
						</View>
					)}

					<ScrollView contentContainerStyle={styles.scrollView}>
						<Text style={styles.header}>
							Team Drills ({Object.values(groupedDrills.team).flat().length})
						</Text>
						{Object.entries(groupedDrills.team).map(
							([category, drills]) => (
								<View key={category} style={styles.section}>
									<Text style={styles.categoryTitle}>
										{category.replace(/\b\w/g, (c) =>
											c.toUpperCase()
										)} ({drills.length})
									</Text>
									{drills.map(renderDrillRow)}
								</View>
							)
						)}

						<Text style={styles.header}>
							Individual Drills ({Object.values(groupedDrills.individual).flat().length})
						</Text>
						{Object.entries(groupedDrills.individual).map(
							([category, drills]) => (
								<View key={category} style={styles.section}>
									<Text style={styles.categoryTitle}>
										{category.replace(/\b\w/g, (c) =>
											c.toUpperCase()
										)} ({drills.length})
									</Text>
									{drills.map(renderDrillRow)}
								</View>
							)
						)}

						{filteredDrills.length === 0 && (
							<View style={styles.emptyState}>
								<MaterialIcons name="search-off" size={48} color="#ccc" />
								<Text style={styles.emptyStateText}>No drills match your filters</Text>
								<TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
									<Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
								</TouchableOpacity>
							</View>
						)}
					</ScrollView>

					<TouchableOpacity
						onPress={() => navigation.navigate("CreateDrill")}
						style={styles.fab}
						activeOpacity={0.8}
					>
						<MaterialIcons name="add" size={28} color="#fff" />
					</TouchableOpacity>

					{renderFilterModal()}
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f8f9fa",
	},
	container: {
		flex: 1,
		position: "relative",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 100,
	},
	header: {
		fontSize: 26,
		fontWeight: "700",
		color: "#222",
		marginVertical: 12,
	},
	section: {
		marginBottom: 24,
	},
	categoryTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#444",
		textTransform: "capitalize",
		marginBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
		paddingBottom: 6,
	},
	drillCard: {
		backgroundColor: "white",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	drillTextContainer: {
		flex: 1,
	},
	drillTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#222",
		marginBottom: 4,
	},
	drillNotes: {
		fontSize: 14,
		color: "#666",
		marginBottom: 8,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	tag: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginRight: 6,
		marginBottom: 4,
	},
	skillTag: {
		backgroundColor: '#e8f5e8',
		borderColor: '#4caf50',
		borderWidth: 1,
	},
	difficultyTag: {
		backgroundColor: '#fff3e0',
		borderColor: '#ff9800',
		borderWidth: 1,
	},
	typeTag: {
		backgroundColor: '#f3e5f5',
		borderColor: '#9c27b0',
		borderWidth: 1,
	},
	tagText: {
		fontSize: 12,
		color: '#666',
		fontWeight: '500',
	},
	moreTagsText: {
		fontSize: 12,
		color: '#999',
		fontStyle: 'italic',
	},
	arrowIcon: {
		marginLeft: 12,
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
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerButton: {
		position: 'relative',
		padding: 4,
	},
	filterBadge: {
		position: 'absolute',
		top: 2,
		right: 2,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FF3B30',
	},
	// Active filters styles
	activeFiltersContainer: {
		backgroundColor: '#fff',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	activeFilter: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#e3f2fd',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
	},
	activeFilterText: {
		fontSize: 14,
		color: '#007AFF',
		fontWeight: '500',
		marginRight: 4,
	},
	removeFilterButton: {
		padding: 2,
	},
	// Modal styles
	modalContainer: {
		flex: 1,
		backgroundColor: '#fff',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#222',
	},
	cancelButton: {
		fontSize: 16,
		color: '#007AFF',
	},
	clearButton: {
		fontSize: 16,
		color: '#FF3B30',
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
		fontWeight: '600',
		color: '#222',
		marginBottom: 16,
	},
	filterOptionsContainer: {
		gap: 8,
	},
	filterOption: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#eee',
	},
	filterOptionSelected: {
		backgroundColor: '#e3f2fd',
		borderColor: '#007AFF',
	},
	filterOptionText: {
		fontSize: 16,
		color: '#222',
		fontWeight: '500',
	},
	filterOptionTextSelected: {
		color: '#007AFF',
	},
	modalFooter: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	applyButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	applyButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	// Empty state styles
	emptyState: {
		alignItems: 'center',
		paddingVertical: 48,
	},
	emptyStateText: {
		fontSize: 16,
		color: '#666',
		marginTop: 16,
		marginBottom: 24,
	},
	clearFiltersButton: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	clearFiltersButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});