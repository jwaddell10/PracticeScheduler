import React, { useState, useEffect } from "react";
import Navigation from "./Navigation";
import { SessionContext } from "./context/SessionContext";
import { PracticesProvider } from "./context/PracticesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DrillsProvider } from "./context/DrillsContext";
import { supabase } from "./lib/supabase";

export default function App() {
	const [session, setSession] = useState(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
	}, []);

	return (
		<SessionContext.Provider value={session}>
			<FavoritesProvider>
				<DrillsProvider>
					<PracticesProvider>
						<Navigation/>
					</PracticesProvider>
				</DrillsProvider>
			</FavoritesProvider>
		</SessionContext.Provider>
	);
}
