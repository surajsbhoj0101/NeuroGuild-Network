import express from "express";
import { createUser, completeRegistration } from "../controllers/auth.controller.js";
import { checkJwt } from "../controllers/auth.controller.js";
import { verifySiwe } from "../controllers/auth.controller.js";
import { getNonce } from "../controllers/auth.controller.js";
import { logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authHttp.middleware.js";
import { checkSkillData } from "../controllers/auth.controller.js";
import { checkSkillName } from "../controllers/auth.controller.js";
import { gitHubAuthStart } from "../controllers/auth.controller.js";
import { getGithubUserData } from "../controllers/auth.controller.js";
import { githubAuthCallback } from "../controllers/auth.controller.js";
import { getPublicProfileByUserId } from "../controllers/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post("/create-user", requireAuth, createUser);
authRoutes.post("/complete-registration", requireAuth, completeRegistration);
authRoutes.get("/check-jwt", checkJwt);
authRoutes.get("/get-nonce", getNonce);
authRoutes.post("/verify-siwe", verifySiwe);
authRoutes.post("/logout", logout);
authRoutes.post('/check-skill-name',checkSkillName);
authRoutes.get('/check-skill-data',checkSkillData);
authRoutes.get('/github', gitHubAuthStart);
authRoutes.get('/github-auth-callback',githubAuthCallback)
authRoutes.get('/github-auth-user',getGithubUserData)
authRoutes.get("/public-profile/:userId", getPublicProfileByUserId);

export default authRoutes;
