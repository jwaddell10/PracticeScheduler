import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";

// The type of the context value (can be null if user is logged out)
export const SessionContext = createContext<Session | null>(null);
// Custom hook for easy use
export const useSession = () => useContext(SessionContext);