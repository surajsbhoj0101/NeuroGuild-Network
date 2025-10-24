import dotenv from "dotenv";
import { Contract, JsonRpcProvider } from "ethers";
import { ERC721SBT } from "../abis/ERC721SBT.js";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

export async function getTokenUri(tokenId) {
    try {
        const contract = new Contract(contractAddress, ERC721SBT, provider);

        const uri = await contract.tokenUri(tokenId);
        if (!uri || uri === "") {
            console.log("No URI found for token:", tokenId);
            return false;
        }

        console.log(`Token URI: ${uri}`);
        return uri;
    } catch (error) {
      
        if (error.reason?.includes("nonexistent token") || error.message?.includes("revert")) {
            console.log(`No tokenURI found for tokenId ${tokenId}`);
            return false;
        }

        console.error("Error fetching token URI:", error.reason || error.message);
        return false;
    }
}



