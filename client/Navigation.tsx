import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";

import HomeScreen from "./components/Home";
import CreatePractice from "./components/CreatePractice";
import Drills from "./components/Drills";
import DrillDetails from "./components/DrillDetails";
import PracticeDetails from "./components/PracticeDetails";
import CreateDrill from "./components/CreateDrill";
import PremiumScreen from "./components/PremiumFeaturesScreen";
import Auth from "./components/Auth";
import Account from "./components/Account";
import Modal from "./components/Modal";
import Clipboard from "./components/Clipboard";

import { useSession } from "./context/SessionContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ClipboardProvider } from "./context/ClipboardContext";
import { UserRoleProvider, useUserRole } from "./context/UserRoleContext";

import theme from "./components/styles/theme"; // Make sure this path is correct
import YourDrills from "./components/YourDrills";
import UpgradeToPremiumBanner from "./components/UpgradeToPremiumBanner";



// ----- Custom Navigation Theme -----
const navigationTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: theme.colors.background,
		card: theme.colors.surface,
		text: theme.colors.textPrimary,
		border: theme.colors.border,
		primary: theme.colors.primary,
	},
};

// ----- Stack Navigators -----
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
	return (
		<HomeStack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: theme.colors.surface },
				headerTintColor: theme.colors.textPrimary,
			}}
		>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Practice" component={CreatePractice} />
			<HomeStack.Screen
				name="Practice Details"
				component={PracticeDetails}
			/>
			<HomeStack.Screen
				name="Modal"
				component={Modal}
				options={{ presentation: "modal" }}
			/>
			<HomeStack.Screen name="Premium" component={PremiumScreen} />
			<HomeStack.Screen
				name="YourDrills"
				component={YourDrills}
				options={{ title: "Your Drills" }}
			/>
			<HomeStack.Screen
				name="DrillDetails"
				component={DrillDetails}
				options={{ title: "Drill Details" }}
			/>
			<HomeStack.Screen
				name="CreateDrill"
				component={CreateDrill}
			/>
		</HomeStack.Navigator>
	);
}

// Component to show upgrade banner for free users
function DrillsUpgradeScreen() {
	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20 }}>
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<UpgradeToPremiumBanner />
			</View>
		</View>
	);
}

const DrillStack = createNativeStackNavigator();
function DrillStackScreen() {
	const { role, loading, isAdmin } = useUserRole();
	
	// Show upgrade screen for free users, drills for premium users or admins
	const DrillsComponent = (!loading && role !== 'premium' && role !== 'Premium' && !isAdmin) 
		? DrillsUpgradeScreen 
		: Drills;

	return (
		<DrillStack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: theme.colors.surface },
				headerTintColor: theme.colors.textPrimary,
			}}
		>
			<DrillStack.Screen name="Drills" component={DrillsComponent} />
			<DrillStack.Screen name="DrillDetails" component={DrillDetails} />
			<DrillStack.Screen name="CreateDrill" component={CreateDrill} />
		</DrillStack.Navigator>
	);
}

const FavoriteDrillsStack = createNativeStackNavigator();
function FavoriteDrillsStackScreen() {
	return (
		<FavoriteDrillsStack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: theme.colors.surface },
				headerTintColor: theme.colors.textPrimary,
			}}
		>
			<FavoriteDrillsStack.Screen
				name="Your Drills"
				component={YourDrills}
			/>
			<FavoriteDrillsStack.Screen
				name="DrillDetails"
				component={DrillDetails}
			/>
			<FavoriteDrillsStack.Screen
				name="CreateDrill"
				component={CreateDrill}
			/>
		</FavoriteDrillsStack.Navigator>
	);
}

const ClipboardStack = createNativeStackNavigator();
function ClipboardStackScreen() {
	return (
		<ClipboardStack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: theme.colors.surface },
				headerTintColor: theme.colors.textPrimary,
			}}
		>
			<ClipboardStack.Screen name="Clipboard" component={Clipboard} />
		</ClipboardStack.Navigator>
	);
}

// ----- Bottom Tab Navigator -----
const Tab = createBottomTabNavigator();

export default function Navigation() {
	const session = useSession();

	return (
		<NavigationContainer theme={navigationTheme}>
			<FavoritesProvider>
				<ClipboardProvider>
					<UserRoleProvider>
						<Tab.Navigator
					screenOptions={({ route }) => ({
						headerShown: false,
						tabBarStyle: {
							backgroundColor: theme.colors.surface,
							borderTopColor: theme.colors.border,
						},
						tabBarActiveTintColor: theme.colors.primary,
						tabBarInactiveTintColor: theme.colors.textMuted,
						tabBarIcon: ({ focused, color, size }) => {
							let iconName: keyof typeof MaterialIcons.glyphMap;

							switch (route.name) {
								case "HomeTab":
									iconName = "home";
									break;
								case "ClipboardTab":
									iconName = "content-paste";
									break;
								case "DrillsTab":
									iconName = "fitness-center";
									break;
								case "FavoriteTab":
									iconName = "star";
									break;
								case "AccountTab":
								case "ProfileTab":
									iconName = "person";
									break;
								default:
									iconName = "circle";
							}

							return (
								<MaterialIcons
									name={iconName}
									size={size}
									color={color}
								/>
							);
						},
					})}
				>
					{session ? (
						<>
							<Tab.Screen
								name="HomeTab"
								component={HomeStackScreen}
								options={{ title: "Home" }}
							/>
							<Tab.Screen
								name="FavoriteTab"
								component={FavoriteDrillsStackScreen}
								options={{ title: "Your Drills" }}
							/>
							<Tab.Screen
								name="DrillsTab"
								component={DrillStackScreen}
								options={{ title: "Drill Library" }}
							/>
							<Tab.Screen
								name="ClipboardTab"
								component={ClipboardStackScreen}
								options={{ title: "Clipboard" }}
							/>
							<Tab.Screen
								name="AccountTab"
								children={() => <Account session={session} />}
								options={{ title: "Profile" }}
							/>
						</>
					) : (
						<Tab.Screen
							name="ProfileTab"
							component={Auth}
							options={{ title: "Profile" }}
						/>
					)}
										</Tab.Navigator>
					</UserRoleProvider>
				</ClipboardProvider>
			</FavoritesProvider>
		</NavigationContainer>
	);
}
