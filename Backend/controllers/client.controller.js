import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js"
import Client from "../models/client_models/clients.model.js"

export const getClient = async (req, res) => {
    const { address } = req.body;
    const walletAddress = address.toLowerCase();

    try {
        const client = await Client.findOne({ walletAddress });
        console.log("Came to fetch")
        if (!client) {
            console.log("Client not found");
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        res.status(200).json({ success: true, client: client });
    } catch (error) {
        console.error("Error fetching freelancer:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateClient = async (req, res) => {
    const { payload, address } = req.body;

    try {
        const walletAddress = address?.toLowerCase();

        // Prevent unwanted overwrite
        const { stats, ...otherUpdates } = payload;

        const updatedUser = await Client.findOneAndUpdate(
            { walletAddress },
            { $set: otherUpdates },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }

        console.log("Done");
        return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating client:", error);
        return res.status(500).json({ success: false, message: "Server error during update." });
    }
};
