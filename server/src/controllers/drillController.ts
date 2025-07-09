const expressAsyncHandler = require("express-async-handler");
const { supabase } = require("../supabase.ts"); // adjust path if needed
// import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";

exports.fetchDrills = expressAsyncHandler(async (req, res, next) => {
	const { data, error } = await supabase.from("Drill").select("*");

    if (error) {
		console.error("Supabase error:", error);
		return res.status(500).json({ error: error.message });
	}

	//   console.log('Data from Supabase:', data);
	res.status(200).json(data);
});
