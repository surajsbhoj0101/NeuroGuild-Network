import { Contract, parseUnits, Interface } from "ethers";
import { ERC721SBT } from "../../../Backend/abis/ERC721SBT";

const contractAddress = "0x5516afd99B82e41E4194ca7ff660f4267dcb8C2d";

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