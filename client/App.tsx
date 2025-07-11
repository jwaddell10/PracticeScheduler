import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import Navigation from "./Navigation";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function App() {
	const [session, setSession] = useState<Session | null>(null);
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});
		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
	}, []);
// 	useEffect(() => {
// 	console.log(session, "updated session");
// }, [session]);
	return <Navigation session={session}></Navigation>;
}
