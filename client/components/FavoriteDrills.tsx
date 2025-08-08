import React, { useContext, useLayoutEffect, useState } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	FlatList,
	Image,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { FavoritesContext } from "../context/FavoritesContext";
import StarButton from "../components/StarButton";
import { useDrillFilters } from "../hooks/useDrillFilters";
import DrillFilterModal from "../components/DrillFilterModal";
import ActiveFiltersBar from "../components/ActiveFiltersBar";

export default function FavoriteDrills() {
	const {
		favoriteDrills,
		favoriteDrillIds,
		loading,
		error,
		handleFavoriteToggle,
	} = useContext(FavoritesContext);

	const navigation = useNavigation();
	const [showFilters, setShowFilters] = useState(false);
	
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

	const filteredDrills = filterDrills(favoriteDrills || []);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() => setShowFilters(true)}
					style={styles.headerButton}
				>
					<MaterialIcons name="filter-list" size={24} color="#007AFF" />
					{hasActiveFilters() && <View style={styles.filterBadge} />}
				</TouchableOpacity>
			),
		});
	}, [navigation, hasActiveFilters]);

	// Helper function to format array values
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
			} catch (e) {
				// If parsing fails, treat as regular string
			}
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
				<Text style={styles.loadingText}>Loading favorite drills...</Text>
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

	if (!favoriteDrills || favoriteDrills.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<MaterialIcons name="favorite-border" size={48} color="#ccc" />
				<Text style={styles.emptyText}>No favorite drills found</Text>
				<Text style={styles.emptySubText}>
					Star some drills to see them here!
				</Text>
			</View>
		);
	}

	const renderDrill = ({ item }) => {
		// Check if this drill is from an admin
		const isAdminDrill = item.users?.role === 'admin';
		const isOwnDrill = item.user_id === item.currentUserId; // You'll need to pass this from context

		return (
			<TouchableOpacity
				style={styles.drillCard}
				activeOpacity={0.7}
				onPress={() => navigation.navigate("Drill Details", { drill: item })}
			>
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						style={styles.drillImage}
						resizeMode="cover"
					/>
				) : (
					<View style={[styles.drillImage, styles.placeholderImage]}>
						<MaterialIcons name="fitness-center" size={24} color="#999" />
					</View>
				)}

				<View style={styles.drillContent}>
					<View style={styles.drillHeader}>
						<Text style={styles.drillTitle} numberOfLines={2}>
							{item.name}
						</Text>
						{isAdminDrill && !isOwnDrill && (
							<View style={styles.adminBadge}>
								<MaterialIcons name="verified" size={16} color="#4CAF50" />
								<Text style={styles.adminBadgeText}>Admin</Text>
							</View>
						)}
						<StarButton
							drillId={item.id}
							initialIsFavorited={favoriteDrillIds.has(item.id)}
							size={20}
							onToggle={(drillId, isFavorited) => {
								handleFavoriteToggle(drillId, isFavorited);
							}}
							style={styles.starButton}
						/>
					</View>

					<View style={styles.drillInfo}>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Focus: </Text>
							<Text style={styles.infoText} numberOfLines={1}>
								{formatArrayValue(item.skillFocus)}
							</Text>
						</View>

						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Type: </Text>
							<Text style={styles.infoText} numberOfLines={1}>
								{formatArrayValue(item.type)}
							</Text>
						</View>

						{item.difficulty && (
							<View style={styles.infoRow}>
								<Text style={styles.infoLabel}>Difficulty: </Text>
								<Text style={styles.infoText} numberOfLines={1}>
									{formatArrayValue(item.difficulty)}
								</Text>
							</View>
						)}

						{item.notes && item.notes.trim() !== "" && (
							<View style={styles.notesContainer}>
								<Text style={styles.infoLabel}>Notes:</Text>
								<Text style={styles.notesText} numberOfLines={3}>
									{item.notes}
								</Text>
							</View>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderEmptyFiltered = () => (
		<View style={styles.emptyFilteredContainer}>
			<MaterialIcons name="search-off" size={48} color="#ccc" />
			<Text style={styles.emptyFilteredText}>
				No favorite drills match your filters
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

			<FlatList
				data={filteredDrills}
				renderItem={renderDrill}
				keyExtractor={(item) => item.id}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
				ListHeaderComponent={() => (
					<View style={styles.headerContainer}>
						<Text style={styles.headerTitle}>
							Favorite Drills ({filteredDrills.length}
							{hasActiveFilters() && ` of ${favoriteDrills.length}`})
						</Text>
					</View>
				)}
				ListEmptyComponent={
					hasActiveFilters() ? renderEmptyFiltered : null
				}
			/>

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
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: "#666",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#ff4444",
		textAlign: "center",
		marginTop: 16,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 20,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginTop: 16,
		textAlign: "center",
	},
	emptySubText: {
		fontSize: 14,
		color: "#666",
		marginTop: 8,
		textAlign: "center",
	},
	emptyFilteredContainer: {
		alignItems: "center",
		paddingVertical: 48,
	},
	emptyFilteredText: {
		fontSize: 16,
		color: "#666",
		marginTop: 16,
		marginBottom: 24,
		textAlign: "center",
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
	listContent: {
		paddingBottom: 20,
	},
	headerContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
		backgroundColor: "#fff",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#000",
	},
	drillCard: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: "#fff",
	},
	drillImage: {
		width: 80,
		height: 80,
		borderRadius: 12,
		marginRight: 16,
		backgroundColor: "#f0f0f0",
	},
	placeholderImage: {
		justifyContent: "center",
		alignItems: "center",
	},
	drillContent: {
		flex: 1,
		paddingRight: 8,
	},
	drillHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	drillTitle: {
		fontSize: 18,
		fontWeight: "bold",
		flex: 1,
		marginRight: 8,
		lineHeight: 22,
		color: "#222",
	},
	adminBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#E8F5E8",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		marginHorizontal: 8,
	},
	adminBadgeText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#4CAF50",
		marginLeft: 2,
	},
	starButton: {
		marginTop: -4,
	},
	drillInfo: {
		gap: 4,
	},
	infoRow: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	infoLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		minWidth: 50,
	},
	infoText: {
		fontSize: 14,
		color: "#666",
		flex: 1,
	},
	notesContainer: {
		marginTop: 8,
	},
	notesText: {
		fontSize: 14,
		color: "#666",
		lineHeight: 20,
		marginTop: 4,
	},
	headerButton: {
		position: "relative",
		padding: 4,
		marginRight: 16,
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
});