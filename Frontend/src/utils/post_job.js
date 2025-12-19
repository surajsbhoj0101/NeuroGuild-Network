import { JobContract } from "../abis/JobContract";
import { Contract, parseUnits } from "ethers";

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

export const postJob = async (
  signer,
  ipfs,
  budget,
  bidDeadline,
  expireDeadline,
  
) => {
  try {
    const bidSec = toUnixSeconds(bidDeadline);
    const expSec = toUnixSeconds(expireDeadline);

    if (!bidSec || !expSec) throw new Error("Deadlines required");
    if (bidSec >= expSec) throw new Error("Bid must be before expiry");

   const tokenDecimals = 18;
    const amountInToken = parseUnits(budget.toString(), tokenDecimals);

    console.log("amountInToken:", amountInToken.toString());

    const contract = new Contract(contractAddress, JobContract, signer);

    const tx = await contract.createJob(
      ipfs,
      amountInToken,
      BigInt(bidSec),
      BigInt(expSec)
    );

    const receipt = await tx.wait();

    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === "JobCreated");

    return {
      success: receipt.status === 1,
      jobId: event?.args?.jobId,
    };
  } catch (error) {
    console.error("postJob error:", error);
    return false;
  }
};
