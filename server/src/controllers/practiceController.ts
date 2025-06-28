const expressAsyncHandler = require("express-async-handler");
// import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";

exports.createPractice = expressAsyncHandler(async (req, res, next) => {
	console.log("createPractice runs");
});
