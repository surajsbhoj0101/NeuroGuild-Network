import User from "../models/user.model.js";

export const test = async (req, res) => {
    res.send("Hello")
}

export const getOrCreateUser = async (req, res) => {
    const { address } = req.params;

    try {
        let newUser = false;
        const walletAddress = address.toLowerCase();

        let user = await User.findOne({ walletAddress });

        if (!user) {
            user = await User.create({
                walletAddress,
                BasicInformation: {
                    name: "New User",
                    title: "",
                    bio: "",
                    location: "",
                    email:"",
                },
                ProfessionalDetails: {
                    hourlyRate: "",
                    experience: "",
                    availability: "available",
                },
                SocialLinks: {
                    github: "",
                    twitter: "",
                    linkedIn: "",
                    website: "",
                },
            });

            console.log(`New user created: ${walletAddress}`);
            newUser = true;
        } else {
            console.log(`Existing user found: ${walletAddress}`);
        }

        res.status(200).json({ success: true, user, newUser });
    } catch (error) {
        console.error("Error in getOrCreateUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



export const getUser = async (req, res) => {
    const { address } = req.params;

    try {
        const walletAddress = address.toLowerCase();
        let user = await User.findOne({ walletAddress });

        if (!user) {
            console.log("User not found")
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const updateUser = async (req, res) => {
 
    const { address } = req.params;
 
    const updateData = req.body;

    console.log("Address:", address);

    try {
        
        const walletAddress = address.toLowerCase();

        
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("Done");
        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, message: "Server error during update." });
    }
};