import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import Client from "../models/client_models/clients.model.js";
import { querySubgraph } from "../services/subgraphClient.js";
import { Wallet } from "ethers";
import { generateNonce, SiweMessage } from "siwe";
import dotenv from "dotenv";
import skillTokenizable from "../services/tokenizableSkills.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios"

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
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie("access_token", newToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
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

export const checkSkillName = async (req, res) => {
  const { skillName } = req.body;

  // Reject if NOT allowed
  if (!skillTokenizable.includes(skillName)) {
    return res.status(403).json({ success: false, error: "Invalid skill" });
  }

  res.cookie("skill_access", skillName, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000
  });

  console.log("Name set success")

  res.json({ success: true });
};


export const checkSkillData = async (req, res) => {
  console.log("Name checking")
  const skillName = req.cookies.skill_access;

  if (!skillName || !skillTokenizable.includes(skillName)) {
    console.log("unauthorize")
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    skill: skillName,
    content: "Protected skill data"
  });
};

export const gitHubAuthStart = async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: "lax"
  })

  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&state=${state}` +
    `&scope=read:user user:email`;

  res.redirect(githubUrl);
}

export const githubAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code/state");
    }

    if (state !== req.cookies.oauth_state) {
      return res.status(403).send("Invalid OAuth state");
    }

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      return res.status(401).send("GitHub token exchange failed");
    }
    console.log("Fetching emailRes")

    const userRes = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const emailRes = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const githubUser = userRes.data;
    const primaryEmail = emailRes.data.find(e => e.primary)?.email;


    const token = jwt.sign(
      {
        githubUser: githubUser,
        email: primaryEmail
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("github_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    console.log(process.env.FRONTEND_URL)
    res.redirect(`${process.env.FRONTEND_URL}/mint-rules`);

  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.status(500).send("OAuth failed");
  }
};

export const getGithubUserData = async (req, res) => {
  try {
    const token = req.cookies?.github_auth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({success:true, data: decoded})
  } catch (error) {
    console.error("GitHub auth data not found", error);
  }
}
