import { Contract, keccak256, toUtf8Bytes } from "ethers";
import { JobContract } from "../abis/JobContract.js";

const contractAddress = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;

export const submitBid = async (signer, amount, jobId) => {


    const amountInUsd = Number(amount);
    const amountInToken = BigInt(Math.round(amountInUsd * 1e6));


    // const idBytes = keccak256(toUtf8Bytes(jobId));





    const contract = new Contract(contractAddress, JobContract, signer);
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
