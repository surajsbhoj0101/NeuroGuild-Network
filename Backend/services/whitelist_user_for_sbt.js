import dotenv from "dotenv";
import { Wallet, Contract, JsonRpcProvider, ZeroAddress, formatUnits, formatEther } from 'ethers';
import { ERC721SBT } from "../abis/ERC721SBT.js";
dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL)
const contractAddress = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function checkAlreadyWhiteListed(address) {
    try {
        const contract = new Contract(contractAddress, ERC721SBT, provider)
        const isWhiteListed = await contract.isWhiteListed(address);
        return isWhiteListed;
    } catch (error) {
        console.log(error)
        console.log("Error came while cheking if user whitelisted")
    }
}

export const whiteListUser = async (address) => {
    try {
        const isAlreadyWhiteListed = await checkAlreadyWhiteListed(address);
        if (isAlreadyWhiteListed) {
            return {
                whiteListSuccess: true
            }
        }
        const wallet = new Wallet(PRIVATE_KEY, provider);
        const contract = new Contract(contractAddress, ERC721SBT, wallet);

        const tx = await contract.addToWhitelist(
            address
        );

        const receipt = await tx.wait();
        console.log("Doing whitelist....")
        return {
            whiteListSuccess: true
        }


    } catch (error) {
        console.log(error)
    }
}

console.log(await whiteListUser("0xb3C8Ec7c00Ca69e2B456382C46711153f80854e0"))

