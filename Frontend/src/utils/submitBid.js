import { Contract, keccak256, toUtf8Bytes } from "ethers";
import { jobContract } from "../abis/JobContract.js";

const contractAddress = "0x18e93bc7dD5aFde9c627ff75d05708028123BFB5";

export const submitBid = async (signer, amount, jobId) => {


    const amountInUsd = Number(amount);
    const amountInToken = BigInt(Math.round(amountInUsd * 1e6));


    // const idBytes = keccak256(toUtf8Bytes(jobId));





    const contract = new Contract(contractAddress, jobContract, signer);
    const job = await contract.getJob(jobId);
    console.log("budget:", job.budget.toString());
    console.log("Deadline:",job.bidDeadline.toString())
    




    const tx = await contract.submitBid(
        jobId,
        amountInToken
    );

    const receipt = await tx.wait();

    return receipt.status === 1;
};
