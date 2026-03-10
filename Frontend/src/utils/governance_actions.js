import { Contract, keccak256, toUtf8Bytes } from "ethers";
import { GovernanceContract } from "../abis/GovernanceContract";

const governorAddress = import.meta.env.VITE_GOVERCONTRACT_ADDRESS;

const ensureGovernorAddress = () => {
  if (!governorAddress) {
    throw new Error("Missing VITE_GOVERCONTRACT_ADDRESS.");
  }
};

const normalizeProposalExecutionPayload = (proposal) => {
  if (!proposal?.description) {
    throw new Error("Proposal description is required.");
  }

  return {
    targets: proposal?.targets || [],
    values: (proposal?.values || []).map((value) => BigInt(value || "0")),
    calldatas: proposal?.calldatas || [],
    descriptionHash: keccak256(toUtf8Bytes(proposal.description)),
  };
};

export const submitProposalVote = async (signer, proposalId, support) => {
  try {
    ensureGovernorAddress();

    if (!proposalId && proposalId !== 0) {
      throw new Error("Proposal id is required.");
    }

    const contract = new Contract(governorAddress, GovernanceContract, signer);
    const tx = await contract.castVote(BigInt(proposalId), support);
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txHash: receipt?.hash || "",
    };
  } catch (error) {
    console.error("submitProposalVote error:", error);
    return {
      success: false,
      error: error?.reason || error?.shortMessage || error?.message || "Failed to submit vote.",
    };
  }
};

export const fetchProposalQuorum = async (provider, timepoint) => {
  try {
    ensureGovernorAddress();

    if (!provider) {
      throw new Error("Provider is required.");
    }

    if (!timepoint && timepoint !== 0) {
      throw new Error("Proposal timepoint is required.");
    }

    const contract = new Contract(governorAddress, GovernanceContract, provider);
    const quorum = await contract.quorum(BigInt(timepoint));

    return {
      success: true,
      quorum: quorum?.toString?.() || "0",
    };
  } catch (error) {
    console.error("fetchProposalQuorum error:", error);
    return {
      success: false,
      error: error?.reason || error?.shortMessage || error?.message || "Failed to fetch quorum.",
    };
  }
};

export const queueProposal = async (signer, proposal) => {
  try {
    ensureGovernorAddress();

    const { targets, values, calldatas, descriptionHash } =
      normalizeProposalExecutionPayload(proposal);
    const contract = new Contract(governorAddress, GovernanceContract, signer);
    const tx = await contract.queue(targets, values, calldatas, descriptionHash);
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txHash: receipt?.hash || "",
    };
  } catch (error) {
    console.error("queueProposal error:", error);
    return {
      success: false,
      error: error?.reason || error?.shortMessage || error?.message || "Failed to queue proposal.",
    };
  }
};

export const executeProposal = async (signer, proposal) => {
  try {
    ensureGovernorAddress();

    const { targets, values, calldatas, descriptionHash } =
      normalizeProposalExecutionPayload(proposal);
    const contract = new Contract(governorAddress, GovernanceContract, signer);
    const tx = await contract.execute(targets, values, calldatas, descriptionHash);
    const receipt = await tx.wait();

    return {
      success: receipt?.status === 1,
      txHash: receipt?.hash || "",
    };
  } catch (error) {
    console.error("executeProposal error:", error);
    return {
      success: false,
      error:
        error?.reason || error?.shortMessage || error?.message || "Failed to execute proposal.",
    };
  }
};
