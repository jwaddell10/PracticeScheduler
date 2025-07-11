import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import Navigation from "./Navigation";

export default function App() {
	return (
		<Navigation></Navigation>
	);
}
