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
