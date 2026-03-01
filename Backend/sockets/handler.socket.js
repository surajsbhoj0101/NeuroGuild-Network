import { registerSocketEvents } from "./event.socket.js";
import { requireAuthSocket } from "../middleware/authSocket.middleware.js";
import { setSocketIO } from "./io.socket.js";

export default function socketHandler(io) {
  setSocketIO(io);
  io.use((socket, next) => requireAuthSocket(socket, next));

  io.on("connection", (socket) => {
    const currentUserId = socket.user?.userId;
    socket.join(currentUserId)
     console.log(`User ${currentUserId} joined personal room`);
    registerSocketEvents(io, socket);
  });
}
