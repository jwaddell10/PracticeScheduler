import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './components/Home';
import CreatePractice from './components/CreatePractice';
import Drills from './components/Drills';
import DrillDetails from './components/DrillDetails';

// Stack for Home
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
	return (
		<HomeStack.Navigator>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Practice" component={CreatePractice} />
		</HomeStack.Navigator>
	);
}

const DrillStack = createNativeStackNavigator();

function DrillStackScreen() {
  return (
    <DrillStack.Navigator>
      <DrillStack.Screen name="Drills" component={Drills} />
      <DrillStack.Screen name="DrillDetails" component={DrillDetails} />
    </DrillStack.Navigator>
  )
}

// Bottom Tabs
const Tab = createBottomTabNavigator();

export default function Navigation() {
	return (
		<NavigationContainer>
			<Tab.Navigator screenOptions={{ headerShown: false}}>
				<Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'Home' }} />
				<Tab.Screen name="DrillsTab" component={DrillStackScreen} options={{ title: 'Drills' }} />
			</Tab.Navigator>
		</NavigationContainer>
	);
}
