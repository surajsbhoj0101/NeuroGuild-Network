import { registerSocketEvents } from "./event.socket.js";
import { requireAuthSocket } from "../middleware/authSocket.middleware.js";
import { setSocketIO } from "./io.socket.js";

export default function socketHandler(io) {
  setSocketIO(io);
  io.use((socket, next) => requireAuthSocket(socket, next));

  io.on("connection", (socket) => {
    const currentUserId = socket.user?.userId;
    const isPending = socket.isPending;

    if (!isPending && currentUserId) {
      socket.join(currentUserId);
      console.log(`User ${currentUserId} connected and joined personal room`);
    } else {
      console.log(`Pending user connected with socket ${socket.id}`);
    }

    registerSocketEvents(io, socket);
  });

  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });
}
