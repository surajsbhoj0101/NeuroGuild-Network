import dotenv from "dotenv";
import { Wallet, Contract, JsonRpcProvider, ZeroAddress, formatUnits, formatEther } from 'ethers';
import { ERC721SBT } from "../abis/ERC721SBT.js";
dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL)
const contractAddress = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function updateHolderSkill(skillName, address, tokenUri) {
    try {
        const wallet = new Wallet(PRIVATE_KEY, provider);
        const contract = new Contract(contractAddress, ERC721SBT, wallet);

        const tx = await contract.updateSkill(
            skillName,
            address,
            tokenUri
        )

        const receipt = await tx.wait();
        console.log("updating skill ....");
        return true;
    } catch (error) {
        console.log(error)
    }
}

// (async () => {
//    const res = await updateHolderSkill("JavaScript", "0x41223c7D104B2d9922A35f66B93bc4E8fE7B8995", "ipfs://bafkreibcxebvfyk3sqeexkqnjwnqyrnla4tmcf2ir7qzvk47jgnprgon7m");
   
// })();
