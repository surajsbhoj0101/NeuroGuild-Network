import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js"
import Client from "../models/client_models/clients.model.js"
import { registerUser } from "../services/register_user_onChain.js";

export const getUser = async (req, res) => {
    const { address } = req.body;
    const walletAddress = address.toLowerCase();

    try {
        const user = await User.findOne({ wallets: walletAddress });

        if (!user) {
            return res.status(200).json({ isFound: false });
        }

        res.status(200).json({ isFound: true, user: user });
    } catch (error) {
        res.status(500).json({ error: error.message || error });
    }
}

export const createUser = async (req, res) => {
    const { address, role } = req.body;
    const walletAddress = address.toLowerCase();

    try {
        console.log("the role is", role)
        let user = await User.findOne({ wallets: walletAddress });

        if (user) {
            return res.status(200).json({ user });
        }
        // "Freelancer", "client"
        let result = false;
        if (role === "client") {
            result = await registerUser(0, walletAddress);
        } else {
            result = await registerUser(1, walletAddress);
        }

        if (result) {
            const newUser = await User.create({
                role,
                wallets: walletAddress
            });
            console.log("Got here ")
            if (role == "Freelancer") {
                console.log("Creating freelancer")
                await Freelancer.create({
                    user: newUser._id,
                    walletAddress: walletAddress
                });
            } else {
                console.log("Creating Client")
                await Client.create({
                    user: newUser._id,
                    walletAddress: walletAddress
                })
            }
            console.log("Create user ....")
            return res.status(201).json({ user: newUser });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || error });
    }
}
