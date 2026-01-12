import { Contract, parseUnits } from "ethers";
import { JobContract } from "../abis/JobContract.js";
import { UsdcAbi } from "../abis/usdc.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

function normalizeNumber(value) {
  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string" && value.includes("e")) {
    return Number(value).toLocaleString("fullwide", {
      useGrouping: false,
      maximumSignificantDigits: 100,
    });
  }

  return value;
}

export const acceptBid = async (jobId, bidIndex, signer, bidAmount) => {
  if (!signer) throw new Error("Signer not found");

  // const normalizedAmount = normalizeNumber(bidAmount);
  // const bidAmountWei = parseUnits(normalizedAmount, 18);

  const jobContract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);

  const usdc = new Contract(USDC_ADDRESS, UsdcAbi, signer);

  const signerAddr = await signer.getAddress();

  const allowance = await usdc.allowance(signerAddr, JOB_CONTRACT_ADDRESS);

  const approveTx = await usdc.approve(JOB_CONTRACT_ADDRESS, 100000);
  await approveTx.wait();

  const tx = await jobContract.acceptBid(jobId, bidIndex);
  const receipt = await tx.wait();

  return receipt.status === 1;
};
