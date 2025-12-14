import { JobContract } from "../abis/JobContract";
import { Contract } from "ethers";

const contractAddress = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;

const toUnixSeconds = (v) => {
    if (v == null || v === "") return null;
    if (typeof v === "number") {
        return v > 1e12 ? Math.floor(v / 1000) : Math.floor(v);
    }

    if (/^\d+$/.test(v)) {
        return v.length > 10 ? Math.floor(Number(v) / 1000) : Number(v);
    }

    const parsed = Date.parse(v);
    if (!isNaN(parsed)) return Math.floor(parsed / 1000);
    throw new Error("Invalid date value: " + String(v));
};

export const postJob = async (signer, ipfs, budget, bidDeadline, expireDeadline) => {
    try {
        const bidSec = toUnixSeconds(bidDeadline);
        const expSec = toUnixSeconds(expireDeadline);

        if (bidSec == null || expSec == null) {
            console.error("Deadlines required");
            return false;
        }
        if (bidSec >= expSec) {
            console.error("Bid deadline must be before expiration/completion deadline");
            return false;
        }

        const amountInUsd = Number(budget);
        const amountInToken = BigInt(Math.round(amountInUsd * 1e6));
        console.log(amountInToken)


        const contract = new Contract(contractAddress, JobContract, signer);

        const tx = await contract.createJob(
            ipfs,
            amountInToken,
            BigInt(bidSec),
            BigInt(expSec)
        );

        const receipt = await tx.wait();
        const event = receipt.logs
            .map(log => contract.interface.parseLog(log))
            .find(e => e && e.name === "JobCreated");

        const jobId = event?.args?.jobId;
        return {
            success: receipt.status === 1,
            jobId: jobId
        }

    } catch (error) {
        console.error("postJob error:", error);
        return false;
    }
};