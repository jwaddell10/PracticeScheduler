import React from "react";
import Navigation from "./Navigation";
import { SessionContext } from "./context/SessionContext";
import { PracticesProvider } from "./context/PracticesContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { DrillsProvider } from "./context/DrillsContext";

export default function App() {

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
