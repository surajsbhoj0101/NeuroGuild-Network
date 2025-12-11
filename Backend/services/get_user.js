import dotenv from "dotenv";
import { Contract, JsonRpcProvider } from "ethers";
import { user as userAbi } from "../abis/UserRegistry.js";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.USER_CONTRACT_ADDRESS;

export const getOchainUser = async (address) => {
    try {
        const contract = new Contract(contractAddress, userAbi, provider);

        const isExist = await contract.isUserExist(address);

        if (!isExist) {
            return {
                exists: false,
                data: null
            };
        }

        const result = await contract.getUser(address);
        return {
            exists: true,
            data: result
        };

    } catch (error) {

        return {
            exists: false,
            data: null
        };
    }
};

console.log(getOchainUser("0xb3c8ec7c00ca69e2b456382c46711153f80854e0"))
