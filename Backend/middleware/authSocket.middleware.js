import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
dotenv.config({ path: "./contract.env" });

const parseCookies = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean) //Removes empty values.
    .reduce((acc, cookie) => {
      const [key, ...rest] = cookie.split("=");
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
};

export const requireAuthSocket = (socket, next) => {
  try {
    const tokenFromAuth = socket.handshake?.auth?.token; //Reads token sent from client with io.
    const cookies = parseCookies(socket.handshake?.headers?.cookie || "");
    const token = tokenFromAuth || cookies.access_token;

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Allow both fully registered users (with userId) and pending users (with pendingSessionKey)
    // However, only users with userId can use messaging features
    if (!decoded?.userId && !decoded?.pendingSessionKey) {
      return next(new Error("Unauthorized: Invalid token"));
    }

    socket.user = decoded;
    socket.isPending = !!decoded.pendingSessionKey && !decoded.userId;
    
    return next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    return next(new Error(`Unauthorized: ${error.message}`));
  }
};
