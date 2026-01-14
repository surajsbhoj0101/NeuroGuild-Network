import { Contract, parseUnits } from "ethers";
import { JobContract } from "../abis/JobContract.js";
import { UsdcAbi } from "../abis/usdc.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

export const acceptBid = async (jobId, bidIndex, signer, bidAmount) => {
  if (!signer) throw new Error("Signer not found");

  const amount = parseUnits(bidAmount.toString(), 18);

  const jobContract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);

  const usdc = new Contract(USDC_ADDRESS, UsdcAbi, signer);
  const clientFeeBps = await jobContract.clientFeeBps();

  const BPS_DIVISOR = 10_000n;
  const clientFee = (amount * clientFeeBps) / BPS_DIVISOR;

  const signerAddr = await signer.getAddress();

  const allowance = await usdc.allowance(signerAddr, JOB_CONTRACT_ADDRESS);
  const total = amount+ clientFee;
  if (allowance < total) {
    const approveTx = await usdc.approve(JOB_CONTRACT_ADDRESS, total);
    await approveTx.wait();
  }

  const tx = await jobContract.acceptBid(jobId, bidIndex);
  const receipt = await tx.wait();

  return receipt.status === 1;
};
