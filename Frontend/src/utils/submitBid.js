import { Contract, keccak256, toUtf8Bytes } from "ethers";
import { jobContract } from "./JobContract";

const contractAddress = "0x18e93bc7dD5aFde9c627ff75d05708028123BFB5";

export const submitBid = async (signer, amount, jobId) => {

    // Convert USD → USDT/USDC format (6 decimals)
    const amountInUsd = Number(amount);
    const amountInToken = BigInt(Math.round(amountInUsd * 1e6));

    // Convert jobId → bytes32
    const idBytes = keccak256(toUtf8Bytes(jobId));

    // Ethers v6 contract instance
    const contract = new Contract(contractAddress, jobContract, signer);

    // Submit bid
    const tx = await contract.submitBid(
        idBytes,
        amountInToken
    );

    const receipt = await tx.wait();

    return receipt.status === 1;
};
