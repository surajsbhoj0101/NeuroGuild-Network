import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  // Configure for production reliability
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  // Use multiple transports for better compatibility
  transports: ["websocket", "polling"],
  // Add request timeout
  timeout: 20000,
  // Enable automatic agent upgrade fallback
  upgrade: true,
  // Path for socket.io
  path: "/socket.io/",
  // Log level for debugging
  ...(import.meta.env.DEV && { debug: true }),
});

// Log socket errors for debugging
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

socket.on("reconnect_attempt", () => {
  console.log("Socket reconnection attempt...");
});

socket.on("reconnect", () => {
  console.log("Socket reconnected successfully");
});

export default socket;