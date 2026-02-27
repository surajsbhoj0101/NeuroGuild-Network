import express from "express";

import { getClient, updateClient } from "../controllers/client.controller.js";
import { requireAuth } from "../middleware/authHttp.middleware.js";

const clientRoutes = express.Router();

clientRoutes.get("/get-client", requireAuth, getClient);
clientRoutes.put("/update-profile", requireAuth, updateClient);

export default clientRoutes;
