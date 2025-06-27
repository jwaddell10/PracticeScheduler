import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";

export const createPractice = expressAsyncHandler(async (req, res, next) => {
	console.log("createPractice runs");
});
