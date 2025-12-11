import { Contract, parseUnits, Interface } from "ethers";
import { ERC721SBT } from "../../../Backend/abis/ERC721SBT";

const contractAddress = "0xd5B0285fC3e065A8548F5dF4EA98a527bC7fb48d";

export async function mintSbt(signer) {
    try {
        const contract = new Contract(contractAddress, ERC721SBT, signer);
        const tx = await contract.mint();
        const receipt = await tx.wait();
        return true;
    } catch (error) {
        console.log(error);
    }
}