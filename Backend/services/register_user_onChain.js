import { user } from "../abis/UserRegistry.js"
import dotenv from "dotenv";
import { Wallet, Contract, JsonRpcProvider } from "ethers";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.USER_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function registerUser(role, walletAddress) {
    try {
        const wallet = new Wallet(PRIVATE_KEY, provider)
        const contract = new Contract(contractAddress, user, wallet);

        const tx = await contract.registerUser(
            role,
            walletAddress
        );
        const receipt = await tx.wait();
        console.log("creating user ....");
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }


}