import dotenv from "dotenv";
import { Wallet, Contract, JsonRpcProvider, ZeroAddress, formatUnits, formatEther } from 'ethers';
import { ERC721SBT } from "../abis/ERC721SBT.js";
dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL)
const contractAddress = "0x005d1b16508852b71c79083df67fbbea3352047a";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function checkAlreadyWhiteListed(address) {
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

console.log( await whiteListUser("0x41223c7D104B2d9922A35f66B93bc4E8fE7B8995"))

