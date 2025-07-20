import React, { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Navigation from "./Navigation";
import { SessionContext } from "./context/SessionContext";

export default function App() {
	const [session, setSession] = useState<Session | null>(null);
	useEffect(() => {
		// Initial session check
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		// Listen for changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => subscription.unsubscribe();
	}, []);

	return (
		<SessionContext.Provider value={session}>
			<Navigation/>
		</SessionContext.Provider>
	);
}
