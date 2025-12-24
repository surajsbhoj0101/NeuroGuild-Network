import express from "express";
import { createUser } from "../controllers/auth.controller.js";
import { checkJwt } from "../controllers/auth.controller.js";
import { verifySiwe } from "../controllers/auth.controller.js";
import { getNonce } from "../controllers/auth.controller.js";
import { logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const authRoutes = express.Router();

authRoutes.post("/create-user", requireAuth, createUser);
authRoutes.get("/check-jwt", checkJwt);
authRoutes.get("/get-nonce", getNonce);
authRoutes.post("/verify-siwe", verifySiwe);
authRoutes.post("/logout", logout);

export default authRoutes;
