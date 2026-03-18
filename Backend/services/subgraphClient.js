import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "./contract.env" });

const SUBGRAPH_URL = process.env.SUBGRAPH_URL;

if (!SUBGRAPH_URL) {
  throw new Error("Missing SUBGRAPH_URL in .env file.");
}

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
