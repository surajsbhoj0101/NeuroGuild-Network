import {user as userAbi} from "../abis/UserRegistry.js";
import {Contract} from "ethers";

const contractAddress = "0xc6a744BA0DC08dc7ae09B9429A030aEDD9Bcb8E2";

export const createUserOnchain = async (signer, role)=>{
    try {
            const contract = new Contract(contractAddress, userAbi, signer);
            const tx = await contract.registerUser(role);
            const receipt = await tx.wait();
            return true;
        } catch (error) {
            console.log(error);
        }
}
