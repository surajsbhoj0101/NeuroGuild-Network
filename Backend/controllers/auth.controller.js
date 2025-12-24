import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import Client from "../models/client_models/clients.model.js";
import { querySubgraph } from "../services/subgraphClient.js";
import { Wallet } from "ethers";
import { generateNonce, SiweMessage } from "siwe";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const getUserQuery = `
  query GetUser($wallet: Bytes!) {
    users(where: { wallet: $wallet }) {
      id
      role
      createdAt
    }
  }
`;

const nonceStore = new Map();

const getUser = async (address) => {
  const walletAddress = address.toLowerCase();
  console.log(walletAddress);
  try {
    const user = await User.findOne({ wallets: walletAddress });

    if (user) {
      return { isFound: true, user };
    }

    console.log("Getting onchain");

    const onchainUser = await querySubgraph(getUserQuery, {
      wallet: walletAddress,
    });
    if (!onchainUser) {
      console.log("Noting found");
      return res.status(200).json({ isFound: false });
    }
    console.log("Onchain user got");
    console.log(onchainUser);

    const roles = ["client", "freelancer"];
    const usr = await User.create({
      role: roles[Number(onchainUser.users[0].role)],
      wallets: walletAddress,
    });

    console.log(usr.role);
    if (usr.role === "client") {
      await Client.create({ user: usr._id, walletAddress });
    } else {
      console.log("Creating freelancer");
      await Freelancer.create({ user: usr._id, walletAddress });
    }

    return { isFound: true, user: usr };
  } catch (error) {
    return { error: error.message || error };
  }
};



export const createUser = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }
    
    const walletAddress = req.walletAddress?.toLowerCase();

    const roleLowerCase = role.toLowerCase();
    console.log(walletAddress, roleLowerCase)

    const existingUser = await User.findOne({ wallets: walletAddress });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      role: roleLowerCase,
      wallets: walletAddress,
    });

    if (roleLowerCase === "client") {
      await Client.create({ user: user._id, walletAddress });
    } else {
      await Freelancer.create({ user: user._id, walletAddress });
    }

    const newToken = jwt.sign(
      {
        address: walletAddress,
        role: roleLowerCase,
        userId: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.cookie("access_token", newToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 60 * 1000,
    });

    return res.status(200).json({ isFound: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "User creation failed" });
  }
};

export const getNonce = async (req, res) => {
  try {
    const nonce = generateNonce();
    console.log("nonce :", nonce);
    nonceStore.set(nonce, {
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return res.status(200).json({ success: true, nonce: nonce });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || error });
  }
};

export const checkJwt = async (req, res) => {
  try {
    const token = req.cookies?.access_token;
    console.log("Came to check");

    if (!token) {
      return res.status(401).json({
        isFound: false,
        message: "Access token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * Expected payload example:
     * {
     *   userId: "...",
     *   address: "0x...",
     *   role: "client" | "freelancer",
     *   iat: 123,
     *   exp: 123
     * }
     */

    if (!decoded?.address) {
      return res.status(401).json({
        isFound: false,
        message: "Invalid token payload",
      });
    }

    req.user = decoded;
    req.walletAddress = decoded.address;

    return res.status(200).json({
      isFound: true,
      address: decoded.address,
      role: decoded.role || null,
      userId: decoded.userId || null,
    });
  } catch (err) {
    return res.status(401).json({
      isFound: false,
      message: "Invalid or expired token",
    });
  }
};

export const verifySiwe = async (req, res) => {
  try {
    const { message, signature } = req.body;

    const siweMessage = new SiweMessage(message);

    const nonceData = nonceStore.get(siweMessage.nonce);

    if (!nonceData || nonceData.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Nonce expired or invalid" });
    }

    await siweMessage.verify({
      signature,
      domain: process.env.DOMAIN,
      nonce: siweMessage.nonce,
    });

    nonceStore.delete(siweMessage.nonce);

    const address = siweMessage.address.toLowerCase();

    const result = await getUser(address);
    const user = result?.user || null;

    const payload = {
      address,
      role: user?.role || null,
      userId: user?._id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    console.log("Set done");
    return res.status(200).json({
      success: true,
      role: payload.role,
      isFound: !!user,
    });
  } catch (error) {
    console.error("SIWE verify error:", error);
    return res.status(401).json({ message: "SIWE verification failed" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.status(200).json({ success: true });
};


