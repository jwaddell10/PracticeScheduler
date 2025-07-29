import {
	View,
	Text,
	ActivityIndicator,
	FlatList,
	Image,
	TouchableOpacity,
} from "react-native";
import { useFavorites } from "../hooks/useFavorites";
import StarButton from "../components/StarButton"; // Adjust path as needed
import { useNavigation } from "@react-navigation/native";

export default function FavoriteDrills() {
	const { favoriteDrills, loading, error, handleFavoriteToggle } =
		useFavorites();
	const navigation = useNavigation();

	console.log(favoriteDrills, "fav drills");

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="large" />
				<Text>Loading favorite drills...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text>Error: {error}</Text>
			</View>
		);
	}

	if (!favoriteDrills || favoriteDrills.length === 0) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Text>No favorite drills found</Text>
			</View>
		);
	}

	const renderDrill = ({ item }) => (
		<TouchableOpacity
			style={{
				padding: 16,
				borderBottomWidth: 1,
				borderBottomColor: "#eee",
				flexDirection: "row",
				alignItems: "flex-start",
			}}
			activeOpacity={0.7}
			onPress={() => navigation.navigate("Drill Details", { drill: item })}
		>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					style={{
						width: 80,
						height: 80,
						borderRadius: 12,
						marginRight: 16,
						backgroundColor: "#f0f0f0",
					}}
					resizeMode="cover"
				/>
			) : (
				<View
					style={{
						width: 80,
						height: 80,
						borderRadius: 12,
						marginRight: 16,
						backgroundColor: "#f0f0f0",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Text style={{ fontSize: 12, color: "#999" }}>
						No Image
					</Text>
				</View>
			)}

			<View style={{ flex: 1, paddingRight: 8 }}>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "flex-start",
						marginBottom: 8,
					}}
				>
					<Text
						style={{
							fontSize: 18,
							fontWeight: "bold",
							flex: 1,
							marginRight: 8,
							lineHeight: 22,
						}}
						numberOfLines={2}
					>
						{item.name}
					</Text>
					<StarButton
						drillId={item.id}
						initialIsFavorited={true}
						size={20}
						onToggle={handleFavoriteToggle}
						style={{ marginTop: -4 }}
					/>
				</View>

				<View
					style={{
						flexDirection: "row",
						marginBottom: 4,
						flexWrap: "wrap",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "600",
							color: "#333",
							minWidth: 50,
						}}
					>
						Focus:{" "}
					</Text>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							textTransform: "capitalize",
							flex: 1,
						}}
						numberOfLines={1}
					>
						{item.skillFocus || "Not specified"}
					</Text>
				</View>

				<View
					style={{
						flexDirection: "row",
						marginBottom: 4,
						flexWrap: "wrap",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "600",
							color: "#333",
							minWidth: 50,
						}}
					>
						Type:{" "}
					</Text>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							textTransform: "capitalize",
							flex: 1,
						}}
						numberOfLines={1}
					>
						{item.type || "Not specified"}
					</Text>
				</View>

				{item.difficulty && (
					<View
						style={{
							flexDirection: "row",
							marginBottom: 4,
							flexWrap: "wrap",
						}}
					>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "600",
								color: "#333",
								minWidth: 70,
							}}
						>
							Difficulty:{" "}
						</Text>
						<Text
							style={{
								fontSize: 14,
								color:
									item.difficulty === "beginner"
										? "#4CAF50"
										: item.difficulty === "intermediate"
										? "#FF9800"
										: "#F44336",
								textTransform: "capitalize",
								fontWeight: "500",
								flex: 1,
							}}
							numberOfLines={1}
						>
							{item.difficulty}
						</Text>
					</View>
				)}

				{item.notes && item.notes.trim() !== "" && (
					<View style={{ marginTop: 8 }}>
						<Text
							style={{
								fontSize: 14,
								fontWeight: "600",
								color: "#333",
								marginBottom: 4,
							}}
						>
							Notes:
						</Text>
						<Text
							style={{
								fontSize: 14,
								color: "#666",
								lineHeight: 20,
							}}
							numberOfLines={3}
						>
							{item.notes}
						</Text>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={{ flex: 1, backgroundColor: "#fff" }}>
			<FlatList
				data={favoriteDrills}
				renderItem={renderDrill}
				keyExtractor={(item) => item.id}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 20 }}
				ListHeaderComponent={() => (
					<View
						style={{
							paddingHorizontal: 16,
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderBottomColor: "#f0f0f0",
							backgroundColor: "#fff",
						}}
					>
						<Text
							style={{
								fontSize: 24,
								fontWeight: "bold",
								textAlign: "left",
								flexWrap: "wrap",
								color: "#000",
							}}
						>
							Favorite Drills ({favoriteDrills.length})
						</Text>
					</View>
				)}
			/>
		</View>
	);
}
