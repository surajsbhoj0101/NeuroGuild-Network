import dotenv from "dotenv";
import { Contract, JsonRpcProvider } from "ethers";
import { ERC721SBT } from "../abis/ERC721SBT.js";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

export const checkUserAlreadyMinted = async (address) => {
    try {
        const contract = new Contract(contractAddress, ERC721SBT, provider);
        const tokenId = await contract.tokenIdOf(address);
        return {
            isminted: true,
            tokenId:tokenId.toString()
        };
    } catch (error) {
        if (error.reason && error.reason.includes("user has no SBT")) {
            console.log("User has not minted an SBT yet.");
            return false;
        }
        console.error("Error checking SBT:", error);
        throw error;
    }
};

// (async () => {
//     await checkUserAlreadyMinted("0x41223c7D104B2d9922A35f66B93bc4E8fE7B8995");
// })();
