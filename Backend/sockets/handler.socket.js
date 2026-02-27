import { registerSocketEvents } from "./event.socket.js";
import { requireAuthSocket } from "../middleware/authSocket.middleware.js";

export default function socketHandler(io) {
  io.use((socket, next) => requireAuthSocket(socket, next));

  io.on("connection", (socket) => {
    registerSocketEvents(io, socket);
  });
}
