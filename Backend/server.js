// server.js
import express from "express";
// import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import freelancerRoutes from "./routes/freelancer.routes.js";
import clientRoutes from "./routes/client.routes.js";
import jobRoutes from "./routes/job.routes.js";
import cookieParser from "cookie-parser";

// dotenv.config();
const app = express();
app.use(cookieParser());


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api/auth", authRoutes);

// Client/Job Poster
app.use("/api/client", clientRoutes);

// Freelancer
app.use("/api/freelancer", freelancerRoutes);

// Job/Listing Endpoints
app.use("/api/jobs", jobRoutes);

// start server
const PORT = 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
