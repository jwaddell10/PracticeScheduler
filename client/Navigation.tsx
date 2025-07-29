import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./components/Home";
import CreatePractice from "./components/CreatePractice";
import Drills from "./components/Drills";
import DrillDetails from "./components/DrillDetails";
import PracticeDetails from "./components/PracticeDetails";
import CreateDrill from "./components/CreateDrill";
import PremiumScreen from "./components/PremiumFeaturesScreen";
import Auth from "./components/Auth";
import Account from "./components/Account";
import { useSession } from "./context/SessionContext";
import Modal from "./components/Modal";
import FavoriteDrills from "./components/FavoriteDrills";

// Stack for Home
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
	return (
		<HomeStack.Navigator>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Practice" component={CreatePractice} />
			<HomeStack.Screen
				name="PracticeDetails"
				component={PracticeDetails}
			/>
			<HomeStack.Screen
				name="Modal"
				component={Modal}
				options={{
					presentation: "modal",
				}}
			/>
			<HomeStack.Screen name="Premium" component={PremiumScreen} />
		</HomeStack.Navigator>
	);
}

const DrillStack = createNativeStackNavigator();

function DrillStackScreen() {
	return (
		<DrillStack.Navigator>
			<DrillStack.Screen name="Drills" component={Drills} />
			<DrillStack.Screen name="DrillDetails" component={DrillDetails} />
			<DrillStack.Screen name="CreateDrill" component={CreateDrill} />
		</DrillStack.Navigator>
	);
}

const FavoriteDrillsStack = createNativeStackNavigator();

function FavoriteDrillsStackScreen() {
	return (
		<FavoriteDrillsStack.Navigator>
			<FavoriteDrillsStack.Screen name="Favorite Drills" component={FavoriteDrills} />
			<FavoriteDrillsStack.Screen name="Drill Details" component={DrillDetails} />
		</FavoriteDrillsStack.Navigator>
	);
}

// const AuthStack = createNativeStackNavigator();

// function AuthStackScreen() {
// 	return (
// 		<AuthStack.Navigator>
// 			{/* <DrillStack.Screen name="Drills" component={Drills} />
// 			<DrillStack.Screen name="DrillDetails" component={DrillDetails} />
// 			<DrillStack.Screen name="CreateDrill" component={CreateDrill} /> */}
// 		</AuthStack.Navigator>
// 	);
// }

// Bottom Tabs
const Tab = createBottomTabNavigator();

export default function Navigation() {
	const session = useSession();

	return (
		<NavigationContainer>
			<Tab.Navigator screenOptions={{ headerShown: false }}>
				{session ? (
					<>
						<Tab.Screen
							name="HomeTab"
							component={HomeStackScreen}
							options={{ title: "Home" }}
						/>
						<Tab.Screen
							name="DrillsTab"
							component={DrillStackScreen}
							options={{ title: "Drills" }}
						></Tab.Screen>
						<Tab.Screen
							name="FavoriteTab"
							component={FavoriteDrillsStackScreen}
							options={{ title: "Your Drills" }}
						></Tab.Screen>
						<Tab.Screen
							name="AccountTab"
							options={{ title: "Profile" }}
						>
							{() => <Account session={session} />}
						</Tab.Screen>
					</>
				) : (
					<Tab.Screen
						name="ProfileTab"
						component={Auth}
						options={{ title: "Profile" }}
					/>
				)}
			</Tab.Navigator>
		</NavigationContainer>
	);
}
