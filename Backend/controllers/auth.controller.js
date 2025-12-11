import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import Client from "../models/client_models/clients.model.js";
import { getOchainUser } from "../services/get_user.js";

export const getUser = async (req, res) => {
    const { address } = req.body;
    const walletAddress = address.toLowerCase();
    console.log(walletAddress)
    try {
        const user = await User.findOne({ wallets: walletAddress });

        if (user) {
            return res.status(200).json({ isFound: true, user });
        }

        console.log("Getting onchain")
        const onchainUser = await getOchainUser(walletAddress);
        if (!onchainUser.exists) {
            return res.status(200).json({ isFound: false });
        }
        console.log("Onchain user got")
        console.log(Number(onchainUser.data[1]))
        const roles = ["client", "freelancer"];
        const usr = await User.create({
            role: roles[Number(onchainUser.data[1])],
            wallets: walletAddress
        });

        console.log(usr.role);
        if (usr.role === "client") {
            await Client.create({ user: usr._id, walletAddress });
        } else {
            console.log("Creating freelancer")
            await Freelancer.create({ user: usr._id, walletAddress });
        }

        return res.status(200).json({ isFound: true, user: usr });

    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};

export const createUser = async (req, res) => {
    const { address, role } = req.body;
    const walletAddress = address.toLowerCase();
    const roleLowerCase = role.toLowerCase();

    try {
        const user = await User.create({
            role: roleLowerCase,
            wallets: walletAddress
        });

        if (roleLowerCase === "client") {
            await Client.create({ user: user._id, walletAddress });
        } else {
            await Freelancer.create({ user: user._id, walletAddress });
        }

        return res.status(200).json({ isFound: true, user });

    } catch (error) {
        return res.status(500).json({ error: error.message || error });
    }
};
