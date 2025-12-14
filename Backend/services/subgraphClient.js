import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.SUBGRAPH_API_KEY;
const SUBGRAPH_ID = process.env.SUBGRAPH_ID; // MUST be Qm...

if (!API_KEY || !SUBGRAPH_ID) {
  throw new Error("Missing SUBGRAPH_API_KEY or SUBGRAPH_ID in .env file.");
}

const SUBGRAPH_URL = `https://api.studio.thegraph.com/query/113184/neuroguild-network/version/latest`;

export async function querySubgraph(query, variables) {
  console.log(query);
  try {
    const response = await axios.post(
      SUBGRAPH_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10_000,
      }
    );
    console.log(JSON.stringify(response.data.errors, null, 2));

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.errors?.[0]?.message ||
        error.message ||
        "Subgraph query failed"
    );
  }
}
