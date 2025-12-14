import {user as userAbi} from "../abis/UserRegistry.js";
import {Contract} from "ethers";

const contractAddress = import.meta.env.VITE_USER_CONTRACT_ADDRESS;

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
