import express from "express";

import { getClient, updateClient } from "../controllers/client.controller.js";



const clientRoutes = express.Router()

clientRoutes.post('/get-client', getClient);
clientRoutes.put('/update-profile', updateClient);

export default clientRoutes