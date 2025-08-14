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
	const [showFilters, setShowFilters] = useState(false);
	const [showCreateDrill, setShowCreateDrill] = useState(false);

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

	// Combine user's own drills and favorites
	const combineDrills = () => {
		const combined = [];
		const seenIds = new Set();

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

		return combined;
	};

	const combinedDrills = combineDrills();
	const filteredDrills = filterDrills(combinedDrills || []);

	const loading = favoritesLoading || userDrillsLoading;
	const error = favoritesError || userDrillsError;

	// Keep filter button in header
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() => setShowFilters(true)}
					style={styles.headerButton}
				>
					<MaterialIcons
						name="filter-list"
						size={24}
						color="#007AFF"
					/>
					{hasActiveFilters() && <View style={styles.filterBadge} />}
				</TouchableOpacity>
			),
		});
	}, [navigation, hasActiveFilters]);

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
		const isAdminDrill = item.users?.role === "admin";
		const isOwnDrill = item.user_id === session?.user?.id;
		const isPublicDrill = item.isPublic === true;
		const isFavorited = item.isFavorited || favoriteDrillIds.has(item.id);
		const isUserCreated = item.isUserDrill || isOwnDrill;

		return (
			<TouchableOpacity
				style={styles.drillCard}
				activeOpacity={0.7}
				onPress={() =>
					navigation.navigate("Drill Details", { drill: item })
				}
			>
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						style={styles.drillImage}
						resizeMode="cover"
					/>
				) : (
					<View style={[styles.drillImage, styles.placeholderImage]}>
						<MaterialIcons
							name="fitness-center"
							size={24}
							color="#999"
						/>
					</View>
				)}

				<View style={styles.drillContent}>
					<View style={styles.drillHeader}>
						<View style={styles.titleContainer}>
							{isFavorited && !isUserCreated && (
								<MaterialIcons
									name="star"
									size={16}
									color="#FFD700"
									style={styles.favoriteIcon}
								/>
							)}
							<Text style={styles.drillTitle} numberOfLines={2}>
								{item.name}
							</Text>
						</View>

						<View style={styles.badgeContainer}>
							{isPublicDrill && (
								<View style={styles.publicBadge}>
									<MaterialIcons
										name="public"
										size={12}
										color="#2196F3"
									/>
									<Text style={styles.publicBadgeText}>
										Public
									</Text>
								</View>
							)}
							{isAdminDrill && !isOwnDrill && (
								<View style={styles.adminBadge}>
									<MaterialIcons
										name="verified"
										size={12}
										color="#4CAF50"
									/>
									<Text style={styles.adminBadgeText}>
										Admin
									</Text>
								</View>
							)}
							{isUserCreated && (
								<View style={styles.myDrillBadge}>
									<MaterialIcons
										name="person"
										size={12}
										color="#FF9800"
									/>
									<Text style={styles.myDrillBadgeText}>
										Mine
									</Text>
								</View>
							)}
						</View>

						{!isUserCreated && (
							<StarButton
								drillId={item.id}
								initialIsFavorited={favoriteDrillIds.has(
									item.id
								)}
								size={20}
								onToggle={(drillId, isFav) =>
									handleFavoriteToggle(drillId, isFav)
								}
								style={styles.starButton}
							/>
						)}
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
								<Text style={styles.infoLabel}>
									Difficulty:{" "}
								</Text>
								<Text style={styles.infoText} numberOfLines={1}>
									{formatArrayValue(item.difficulty)}
								</Text>
							</View>
						)}
						{item.notes && item.notes.trim() !== "" && (
							<View style={styles.notesContainer}>
								<Text style={styles.infoLabel}>Notes:</Text>
								<Text
									style={styles.notesText}
									numberOfLines={3}
								>
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

			<FlatList
				data={filteredDrills}
				renderItem={renderDrill}
				keyExtractor={(item) => item.id}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
				ListHeaderComponent={() => (
					<View style={styles.headerContainer}>
						<Text style={styles.headerTitle}>
							My Drills & Favorites ({filteredDrills.length}
							{hasActiveFilters() &&
								` of ${combinedDrills.length}`}
							)
						</Text>
					</View>
				)}
				ListEmptyComponent={
					hasActiveFilters() ? renderEmptyFiltered : null
				}
			/>

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
							<MaterialIcons
								name="close"
								size={24}
								color="#007AFF"
							/>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>Create New Drill</Text>
						<View style={{ width: 24 }} />
					</View>
					<CreateDrill
						refreshDrills={() => {
							refreshDrills();
							setShowCreateDrill(false);
						}}
						onClose={() => setShowCreateDrill(false)}
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
				filteredCount={filteredDrills.length}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		marginTop: 10,
		fontSize: 16,
		color: "#ff4444",
		textAlign: "center",
	},
	headerButton: {
		padding: 8,
		borderRadius: 20,
		backgroundColor: "#f8f9fa",
		position: "relative",
	},
	filterBadge: {
		position: "absolute",
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#ff4444",
	},
	listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 80 }, // leave space for FAB
	headerContainer: { paddingVertical: 16 },
	headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
	drillCard: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 12,
		marginBottom: 16,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		overflow: "hidden",
	},
	drillImage: { width: 100, height: 120, backgroundColor: "#f5f5f5" },
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
		color: "#333",
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
		backgroundColor: "#E3F2FD",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
	},
	publicBadgeText: {
		fontSize: 10,
		color: "#2196F3",
		fontWeight: "500",
		marginLeft: 2,
	},
	adminBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#E8F5E8",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
	},
	adminBadgeText: {
		fontSize: 10,
		color: "#4CAF50",
		fontWeight: "500",
		marginLeft: 2,
	},
	myDrillBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF3E0",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
	},
	myDrillBadgeText: {
		fontSize: 10,
		color: "#FF9800",
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
	infoLabel: { fontSize: 12, fontWeight: "600", color: "#666", minWidth: 60 },
	infoText: { flex: 1, fontSize: 12, color: "#333" },
	notesContainer: { marginTop: 4 },
	notesText: { fontSize: 12, color: "#666", lineHeight: 16, marginTop: 2 },
	emptyFilteredContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	emptyFilteredText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#666",
		marginTop: 16,
		textAlign: "center",
	},
	clearFiltersButton: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 16,
	},
	clearFiltersButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
	fab: {
		position: "absolute",
		bottom: 20,
		right: 20,
		backgroundColor: "#007AFF",
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
	},
	modalContainer: { flex: 1, backgroundColor: "#fff" },
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
		backgroundColor: "#f8f9fa",
	},
	modalTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
	modalCloseButton: { padding: 4 },
});
