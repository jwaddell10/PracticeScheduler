import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";

export const fetchDrills = expressAsyncHandler(async (req, res, next) => {
    console.log("drill practice runs runs");
});