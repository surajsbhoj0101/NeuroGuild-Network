// server.js
import express from "express";
// import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";

// dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use(userRoutes);

// start server
const PORT = 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
