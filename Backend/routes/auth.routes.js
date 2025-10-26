import express from "express";
import { getUser } from "../controllers/auth.controller.js";
import { createUser } from "../controllers/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post('/get-user', getUser)

authRoutes.post('/create-user', createUser)

export default authRoutes
