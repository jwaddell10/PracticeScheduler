import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";

export const fetchPractices = expressAsyncHandler(async (req, res, next) => {
    console.log("home practice runs runs");
});
