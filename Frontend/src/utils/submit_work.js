import { Contract } from "ethers";
import { JobContract } from "../abis/JobContract.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;

export const submitWorkOnChain = async (jobId, ipfsProof, signer) => {
  if (!signer) throw new Error("Signer not found");
  if (!jobId) throw new Error("Job ID is required");
  if (!ipfsProof?.trim()) throw new Error("Proof link is required");

  const contract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);
  const tx = await contract.submitWork(jobId, ipfsProof.trim());
  const receipt = await tx.wait();
  return receipt?.status === 1;
};
