import { Contract, Interface } from "ethers";
import { JobContract } from "../abis/JobContract.js";
import GovernanceContract from "../abis/GovernanceContract.js";
import api from "./api.js";

const JOB_CONTRACT_ADDRESS = import.meta.env.VITE_JOB_CONTRACT_ADDRESS;
const GOVERNOR_CONTRACT_ADDRESS =
  import.meta.env.VITE_GOVERCONTRACT_ADDRESS ||
  import.meta.env.VITE_GOVER_CONTRACT_ADDRESS;

const normalizeProofLinks = (proofs = []) =>
  (Array.isArray(proofs) ? proofs : [proofs]).filter(Boolean);

const buildDisputeProposalDescription = ({
  jobId,
  reasonIpfs,
  evidenceIpfs,
  actorAddress,
  actorRole,
  jobTitle,
  disputeContext,
}) => {
  const normalizedRole = actorRole === "client" ? "Client" : "Freelancer";
  const title = jobTitle?.trim?.() || `Job ${jobId}`;
  const proofLinks = normalizeProofLinks(disputeContext?.workProofLinks);
  const lines = [
    `Dispute Resolution: ${title}`,
    `Job ID: ${jobId}`,
    `Raised by: ${normalizedRole} ${actorAddress}`,
    `Requested winner: ${actorAddress}`,
  ];

  if (disputeContext?.clientAddress) {
    lines.push(`Client: ${disputeContext.clientAddress}`);
  }

  if (disputeContext?.freelancerAddress) {
    lines.push(`Freelancer: ${disputeContext.freelancerAddress}`);
  }

  if (disputeContext?.submittedAt) {
    lines.push(`Work submitted at: ${disputeContext.submittedAt}`);
  }

  lines.push(`Reason IPFS: ${reasonIpfs}`);
  lines.push(`Evidence IPFS: ${evidenceIpfs}`);
  lines.push(`Submitted proof count: ${proofLinks.length}`);

  proofLinks.slice(0, 3).forEach((proof, index) => {
    lines.push(`Work Proof ${index + 1}: ${proof}`);
  });

  lines.push(
    "This proposal resolves the disputed job in favor of the wallet that raised the dispute.",
  );

  return lines.join("\n");
};

const createDisputeGovernanceProposal = async ({
  signer,
  jobId,
  reasonIpfs,
  evidenceIpfs,
  actorAddress,
  actorRole,
  jobTitle,
  disputeContext,
}) => {
  if (!GOVERNOR_CONTRACT_ADDRESS) {
    throw new Error("Missing governance contract address.");
  }

  if (!JOB_CONTRACT_ADDRESS) {
    throw new Error("Missing job contract address.");
  }

  const jobInterface = new Interface(JobContract);
  const calldata = jobInterface.encodeFunctionData("resolveDispute", [
    jobId,
    actorAddress,
  ]);

  const description = buildDisputeProposalDescription({
    jobId,
    reasonIpfs,
    evidenceIpfs,
    actorAddress,
    actorRole,
    jobTitle,
    disputeContext,
  });

  const governor = new Contract(
    GOVERNOR_CONTRACT_ADDRESS,
    GovernanceContract,
    signer
  );

  const tx = await governor.propose(
    [JOB_CONTRACT_ADDRESS],
    [0n],
    [calldata],
    description
  );
  const receipt = await tx.wait();

  const proposalCreated = receipt.logs
    .map((log) => {
      try {
        return governor.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((entry) => entry?.name === "ProposalCreated");

  if (!proposalCreated) {
    throw new Error(
      "Dispute was raised, but governance proposal creation could not be confirmed."
    );
  }

  return {
    txHash: receipt?.hash || "",
    proposalId: proposalCreated.args?.proposalId?.toString?.() || "",
    description,
  };
};

export const raiseDisputeOnChain = async ({
  jobId,
  reason,
  signer,
  actorRole,
  jobTitle,
  disputeContext = {},
}) => {
  try {
    if (!signer) {
      throw new Error("Signer not found.");
    }

    if (!jobId) {
      throw new Error("Job ID is required.");
    }

    const normalizedReason = reason?.trim?.();
    if (!normalizedReason) {
      throw new Error("Dispute reason is required.");
    }

    const actorAddress = await signer.getAddress();

    const reasonPayload = {
      type: "job-dispute",
      jobId,
      actorRole: actorRole || "unknown",
      actorAddress,
      reason: normalizedReason,
      createdAt: new Date().toISOString(),
    };

    const ipfsResponse = await api.post("/api/jobs/get-bid-proposal-ipfs", {
      payload: reasonPayload,
    });
    const reasonIpfs = ipfsResponse?.data?.ipfs;

    if (!reasonIpfs) {
      throw new Error("Failed to upload dispute reason to IPFS.");
    }

    const evidencePayload = {
      type: "job-dispute-evidence",
      jobId,
      jobTitle: jobTitle || "",
      actorRole: actorRole || "unknown",
      actorAddress,
      reason: normalizedReason,
      reasonIpfs,
      createdAt: new Date().toISOString(),
      jobContext: {
        clientName: disputeContext?.clientName || "",
        clientAddress: disputeContext?.clientAddress || "",
        freelancerName: disputeContext?.freelancerName || "",
        freelancerAddress: disputeContext?.freelancerAddress || "",
        budget: disputeContext?.budget ?? disputeContext?.contractValue ?? "",
        deadline: disputeContext?.deadline || "",
        submittedAt: disputeContext?.submittedAt || "",
        skills: Array.isArray(disputeContext?.skills) ? disputeContext.skills : [],
      },
      workProofLinks: normalizeProofLinks(disputeContext?.workProofLinks),
      workProofLink: disputeContext?.workProofLink || "",
      jobDescription: disputeContext?.jobDescription || "",
    };

    const evidenceResponse = await api.post("/api/jobs/get-bid-proposal-ipfs", {
      payload: evidencePayload,
    });
    const evidenceIpfs = evidenceResponse?.data?.ipfs;

    if (!evidenceIpfs) {
      throw new Error("Failed to upload dispute evidence to IPFS.");
    }

    const contract = new Contract(JOB_CONTRACT_ADDRESS, JobContract, signer);
    const tx = await contract.raiseDispute(jobId, reasonIpfs);
    const receipt = await tx.wait();

    let governanceResult = null;

    try {
      governanceResult = await createDisputeGovernanceProposal({
        signer,
        jobId,
        reasonIpfs,
        evidenceIpfs,
        actorAddress,
        actorRole,
        jobTitle,
        disputeContext,
      });
    } catch (governanceError) {
      console.error("createDisputeGovernanceProposal error:", governanceError);
    }

    return {
      success: receipt?.status === 1,
      txHash: receipt?.hash || "",
      reasonIpfs,
      evidenceIpfs,
      governanceProposalCreated: Boolean(governanceResult?.proposalId),
      governanceProposalId: governanceResult?.proposalId || "",
      governanceTxHash: governanceResult?.txHash || "",
      governanceError:
        governanceResult?.proposalId
          ? ""
          : "Dispute was raised, but the governance proposal was not created. Check proposer threshold and governor permissions.",
    };
  } catch (error) {
    console.error("raiseDisputeOnChain error:", error);
    return {
      success: false,
      error:
        error?.reason || error?.shortMessage || error?.message || "Failed to raise dispute.",
    };
  }
};
