import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      console.log("Token not found");
      return res.status(401).json({ message: "Not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId && !decoded?.pendingSessionKey) {
      return res.status(401).json({ message: "Invalid auth payload" });
    }

    req.user = decoded;
    req.userId = decoded?.userId || null;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
