"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const expressAsyncHandler = require("express-async-handler");
// import { Request, Response, NextFunction } from "express";
// import db from "../db/queries";
exports.fetchDrills = expressAsyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("drill practice runs runs");
}));
