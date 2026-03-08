import { Contract, Interface } from "ethers";
import GovernanceContract from "../abis/GovernanceContract.js";
import { call } from "viem/actions";

const contractAddress = import.meta.env.VITE_GOVER_CONTRACT_ADDRESS;

const parseActionArgs = (rawArgs) => {
  const trimmed = rawArgs?.trim?.() || "";
  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed);
  console.log("Parsed",parsed)
  return Array.isArray(parsed) ? parsed : [parsed];
};

const normalizeActions = (actions = []) =>
  actions
    .filter((action) => action?.target?.trim() && action?.functionSignature?.trim())
    .map((action) => {
      const signature = action.functionSignature.trim();
      const iface = new Interface([`function ${signature}`]);
      const fragment = iface.fragments[0];
      const args = parseActionArgs(action.args);
      const calldata = iface.encodeFunctionData(fragment.name, args);

      return {
        target: action.target.trim(),
        value: BigInt(action.value?.toString?.().trim?.() || "0"),
        calldata,
      };
    });

export const createProposal = async (signer, { description, actions }) => {
  try {
    if (!contractAddress) {
      throw new Error("Governance contract address is not configured.");
    }

    const normalizedActions = normalizeActions(actions);
    if (!normalizedActions.length) {
      throw new Error("At least one governance action is required.");
    }
    if (!description?.trim()) {
      throw new Error("Proposal description is required.");
    }

    const contract = new Contract(contractAddress, GovernanceContract, signer);
    const targets = normalizedActions.map((action) => action.target);
    const values = normalizedActions.map((action) => action.value);
    const calldatas = normalizedActions.map((action) => action.calldata);
    console.log(targets+ values+ calldatas)
    const tx = await contract.propose(targets, values, calldatas, description.trim());
    const receipt = await tx.wait();

    const proposalCreated = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((entry) => entry?.name === "ProposalCreated");

    if (!proposalCreated) {
      throw new Error("Proposal transaction succeeded but no ProposalCreated event was found.");
    }

    return {
      success: receipt.status === 1,
      txHash: receipt.hash,
      proposalId: proposalCreated.args?.proposalId?.toString?.() || "",
      voteStart: proposalCreated.args?.voteStart?.toString?.() || "",
      voteEnd: proposalCreated.args?.voteEnd?.toString?.() || "",
      description: proposalCreated.args?.description || description.trim(),
      targets,
      values: values.map((value) => value.toString()),
      calldatas,
    };
  } catch (error) {
    console.error("createProposal error:", error);
    return {
      success: false,
      error: error?.reason || error?.shortMessage || error?.message || "Failed to create proposal.",
    };
  }
};
