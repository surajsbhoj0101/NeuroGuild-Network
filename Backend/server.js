// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import freelancerRoutes from "./routes/freelancer.routes.js";
import clientRoutes from "./routes/client.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import governanceRoutes from "./routes/governance.routes.js";
import cookieParser from "cookie-parser";
import conversationRoutes from "./routes/conversation.routes.js";
import { Server } from "socket.io";
import { createServer } from "http";
import socketHandler from "./sockets/handler.socket.js";
dotenv.config();
dotenv.config({ path: "./contract.env" });

const frontendOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const redirectOrigin = (process.env.FRONTEND_REDIRECT_URL || "").trim();

if (redirectOrigin) {
  frontendOrigins.push(redirectOrigin);
}

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/$/, "").toLowerCase();
const allowedOrigins = new Set(frontendOrigins.map(normalizeOrigin).filter(Boolean));

if (!allowedOrigins.size) {
  throw new Error("Missing FRONTEND_URL in environment.");
}

const corsOriginValidator = (origin, callback) => {
  if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  callback(new Error("Not allowed by CORS"));
};

const app = express();
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginValidator,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

socketHandler(io);

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// Client/Job Poster
app.use("/api/client", clientRoutes);

// Freelancer
app.use("/api/freelancer", freelancerRoutes);

// Job/Listing Endpoints
app.use("/api/jobs", jobRoutes);

// Conversation and Messaging Endpoints
app.use("/api/conversations", conversationRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

//governanace
app.use("/api/governance", governanceRoutes);

// start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
