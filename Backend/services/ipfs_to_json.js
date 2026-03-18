import axios from "axios";

const IPFS_GATEWAY_URL = (process.env.IPFS_GATEWAY_URL || "").replace(/\/$/, "");

export async function getJsonFromIpfs(uri) {
  try {
    console.log("Gpt jere")
    if (!uri) {
      console.error("No URI provided to fetch from IPFS");
      return false;
    }

    if (!IPFS_GATEWAY_URL) {
      console.error("Missing IPFS_GATEWAY_URL in environment");
      return false;
    }

    console.log("Fetching from IPFS:", uri);
    const ipfsCid = uri.replace("ipfs://", "");
    const url = `${IPFS_GATEWAY_URL}/ipfs/${ipfsCid}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    const json = response.data;
    

    // console.log("JSON fetched:", json);
    return  JSON.parse(json); ;
  } catch (error) {
    console.error("Error fetching JSON from IPFS:", error.message);
    return false;
  }
}
