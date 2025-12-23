import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      console.log("Token not found");
      res.status(401).json({ message: "Not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.walletAddress = decoded.address;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
