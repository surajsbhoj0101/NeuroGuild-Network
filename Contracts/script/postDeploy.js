import fs from "fs";
import path from "path";

const broadcastPath = path.join(
  process.cwd(),
  "broadcast/DeploymentScript.sol/84532/run-latest.json"
);
const frontEndEnvPath = path.join(process.cwd(), "../Frontend/contract.env");
const backEndEnvPath = path.join(process.cwd(), "../Backend/contract.env");
const subgraphEnvPath = path.join(process.cwd(), "../subgraph/contract.env");

const aliasByContractName = {
  ERC20Usdc: "USDC_ADDRESS",
  UserRegistry: "USER_CONTRACT_ADDRESS",
  JobContract: "JOB_CONTRACT_ADDRESS",
};

const toNormalKey = (contractName) => `${contractName.toUpperCase()}_ADDRESS`;
const toViteKey = (normalKey) => `VITE_${normalKey}`;

const readBroadcast = async () => {
  try {
    const fileContent = fs.readFileSync(broadcastPath, "utf8");
    const data = JSON.parse(fileContent);

    const normalEnvMap = new Map();

    data.transactions
      .filter((tx) => tx.contractName && tx.contractAddress)
      .forEach((tx) => {
        const normalKey = toNormalKey(tx.contractName);
        normalEnvMap.set(normalKey, tx.contractAddress);

        const aliasKey = aliasByContractName[tx.contractName];
        if (aliasKey) normalEnvMap.set(aliasKey, tx.contractAddress);
      });

    if (normalEnvMap.size > 0) {
      const normalFileString =
        [...normalEnvMap.entries()]
          .map(([key, value]) => `${key}=${value}`)
          .sort()
          .join("\n") + "\n";

      const frontendFileString =
        [
          ...[...normalEnvMap.entries()].map(([key, value]) => `${key}=${value}`),
          ...[...normalEnvMap.entries()].map(([key, value]) => `${toViteKey(key)}=${value}`),
        ]
          .sort()
          .join("\n") + "\n";

      fs.writeFileSync(frontEndEnvPath, frontendFileString);
      fs.writeFileSync(backEndEnvPath, normalFileString);
      fs.writeFileSync(subgraphEnvPath, normalFileString);

      console.log("contract.env files updated");
    } else {
      console.log("No result found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

readBroadcast();
