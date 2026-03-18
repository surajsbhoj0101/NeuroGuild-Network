import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
});

export default socket;