import { Contract, parseUnits, Interface } from "ethers";
import { ERC721SBT } from "../../../Backend/abis/ERC721SBT";

const contractAddress = "0x7B95BC680e8425dbC46e49ddDAF5CAEcbbE87A44";

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