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

const app = express();
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:80",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

socketHandler(io);

app.use(
  cors({
    origin: "http://localhost:5173",
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
const PORT = 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
