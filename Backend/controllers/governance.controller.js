import { querySubgraph } from "../services/subgraphClient.js";
import { getJsonFromIpfs } from "../services/ipfs_to_json.js";
import dotenv from "dotenv";

dotenv.config();

const proposalsFetchQuery = `
query fetchProposals{
     proposals{
        id
        description
        calldatas
        targets
        proposer
        signatures
        status
        voteEnd
        voteStart
        values
        updatedAt
        votes {
          support
          weight
          voter
        }
    }
}                     
`;

const proposalByIdQuery = `
query fetchProposalById($proposalId: String!) {
  proposals(where: { id: $proposalId }) {
    id
    description
    calldatas
    targets
    proposer
    signatures
    status
    voteEnd
    voteStart
    values
    updatedAt
    votes {
      support
      weight
      voter
    }
  }
}
`;

export const fetchProposals = async (req, res) => {
  try {
    const data = await querySubgraph(proposalsFetchQuery);
    const proposals = data.proposals;
    return res.status(200).json({
      success: true,
      proposals: proposals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchProposalById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Proposal id is required",
      });
    }

    const data = await querySubgraph(proposalByIdQuery, { proposalId: id });
    const proposal = data?.proposals?.[0];

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    return res.status(200).json({
      success: true,
      proposal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
