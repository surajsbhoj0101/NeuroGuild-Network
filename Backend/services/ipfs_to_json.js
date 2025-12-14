import axios from "axios";
export async function getJsonFromIpfs(uri) {
  try {
    console.log("Gpt jere")
    if (!uri) {
      console.error("No URI provided to fetch from IPFS");
      return false;
    }

    console.log("Fetching from IPFS:", uri);
    const url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    const json = response.data;

    console.log("JSON fetched:", json);
    return  JSON.parse(json); ;
  } catch (error) {
    console.error("Error fetching JSON from IPFS:", error.message);
    return false;
  }
}
