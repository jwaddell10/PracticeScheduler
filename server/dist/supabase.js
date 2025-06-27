"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// import Constants from 'expo-constants';
const supabaseUrl = "https://nugqfaokqrotfakpjqnk.supabase.co";
const supabaseKey = process.env.EXPO_SUPABASE_NEW_KEY || "";
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
