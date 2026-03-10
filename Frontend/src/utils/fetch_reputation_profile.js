import { Contract, JsonRpcProvider } from "ethers";
import { ReputationSBT } from "../abis/ReputationSBT.js";

const REPUTATION_ADDRESS = import.meta.env.VITE_REPUTATIONSBT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;

export const emptyReputationProfile = {
  hasReputationSbt: false,
  tokenId: "",
  completedJobs: 0,
  failedJobs: 0,
  disputeCount: 0,
  ratingAverage: 0,
  reliabilityScore: 0,
  totalScore: "0",
  lastUpdated: 0,
  metadataURI: "",
  revoked: false,
};

export const fetchReputationProfile = async (address) => {
  if (!address || !REPUTATION_ADDRESS || !RPC_URL) {
    return emptyReputationProfile;
  }

  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const reputation = new Contract(REPUTATION_ADDRESS, ReputationSBT, provider);
    const tokenId = await reputation.getTokenId(address);
    const normalizedTokenId = tokenId?.toString?.() || "0";

    if (normalizedTokenId === "0") {
      return emptyReputationProfile;
    }

    const repData = await reputation.repData(tokenId);

    return {
      hasReputationSbt: true,
      tokenId: normalizedTokenId,
      completedJobs: Number(repData?.completedJobs || 0),
      failedJobs: Number(repData?.failedJobs || 0),
      disputeCount: Number(repData?.disputeCount || 0),
      ratingAverage: Number(repData?.ratingAverage || 0),
      reliabilityScore: Number(repData?.reliabilityScore || 0),
      totalScore: repData?.totalScore?.toString?.() || "0",
      lastUpdated: Number(repData?.lastUpdated || 0),
      metadataURI: repData?.metadataURI || "",
      revoked: Boolean(repData?.revoked),
    };
  } catch (error) {
    console.error("Failed to fetch reputation profile:", error);
    return emptyReputationProfile;
  }
};
