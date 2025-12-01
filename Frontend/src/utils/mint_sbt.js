import { Contract, parseUnits, Interface } from "ethers";
import { ERC721SBT } from "../../../Backend/abis/ERC721SBT";

const contractAddress = "0xBbB803f45195002bE812D8cC4E434CA4A5bBA56d";

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