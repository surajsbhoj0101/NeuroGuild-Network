import { Contract, JsonRpcProvider } from "ethers";
import { ReputationSBT } from "../abis/ReputationSBT.js";

const REPUTATION_ADDRESS = import.meta.env.VITE_REPUTATIONSBT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;

export const emptyReputationSbtStatus = {
  hasReputationSbt: false,
  balance: 0,
};

export const checkHasReputationSbt = async (address) => {
  if (!address || !REPUTATION_ADDRESS || !RPC_URL) {
    return emptyReputationSbtStatus;
  }

  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const reputationSbt = new Contract(REPUTATION_ADDRESS, ReputationSBT, provider);
    const balance = await reputationSbt.balanceOf(address);
    const balanceNumber = Number(balance);

    return {
      hasReputationSbt: Number.isFinite(balanceNumber) && balanceNumber > 0,
      balance: Number.isFinite(balanceNumber) ? balanceNumber : 0,
    };
  } catch (error) {
    console.error("Failed to fetch reputation SBT status:", error);
    return emptyReputationSbtStatus;
  }
};
