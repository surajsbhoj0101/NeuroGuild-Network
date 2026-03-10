import { Contract } from "ethers";
import { JobContract } from "../abis/JobContract.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;

const ensureContractAddress = () => {
  if (!JOB_CONTRACT_ADDRESS) {
    throw new Error("Missing VITE_JOB_CONTRACT_ADDRESS.");
  }
};

export const submitJobRating = async ({ jobId, rating, role, signer }) => {
  try {
    ensureContractAddress();

    if (!signer) {
      throw new Error("Signer not found.");
    }

    if (!jobId) {
      throw new Error("Job ID is required.");
    }

    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new Error("UI rating must be between 1 and 5 stars.");
    }

    // The contract stores ratings on a 0-10 scale.
    const onchainRating = normalizedRating * 2;

    const contract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);
    const tx =
      role === "client"
        ? await contract.rateFreelancer(jobId, onchainRating)
        : await contract.rateClient(jobId, onchainRating);
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txHash: receipt?.hash || "",
    };
  } catch (error) {
    console.error("submitJobRating error:", error);
    return {
      success: false,
      error: error?.reason || error?.shortMessage || error?.message || "Failed to submit rating.",
    };
  }
};
