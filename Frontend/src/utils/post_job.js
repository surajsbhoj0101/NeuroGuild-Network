import { jobContract } from "./JobContract";
import { Contract } from "ethers";

const contractAddress = "0x18e93bc7dD5aFde9c627ff75d05708028123BFB5";

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

        // Convert budget to BigInt
        const budgetBn = BigInt(budget);

        const contract = new Contract(contractAddress, jobContract, signer);

        const tx = await contract.createJob(
            ipfs,
            budgetBn,
            BigInt(bidSec),
            BigInt(expSec)
        );

        const receipt = await tx.wait();
        return receipt.status === 1;
    } catch (error) {
        console.error("postJob error:", error);
        return false;
    }
};