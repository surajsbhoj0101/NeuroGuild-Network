import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

const parseEnvFile = (filePath) => {
  const result = {};
  if (!fs.existsSync(filePath)) return result;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
};

const contractEnv = parseEnvFile(new URL("./contract.env", import.meta.url));

const contractKeyAliases = {
  VITE_BOX_ADDRESS: ["VITE_BOX_ADDRESS"],
  VITE_COUNCILREGISTRY_ADDRESS: ["VITE_COUNCIL_REGISTRY_ADDRESS"],
  VITE_ERC20USDC_ADDRESS: ["VITE_ERC20_USDC_ADDRESS", "VITE_USDC_ADDRESS"],
  VITE_GOVERCONTRACT_ADDRESS: ["VITE_GOVER_CONTRACT_ADDRESS"],
  VITE_GOVERNANCETOKEN_ADDRESS: ["VITE_GOVERNANCE_TOKEN_ADDRESS"],
  VITE_JOBCONTRACT_ADDRESS: ["VITE_JOB_CONTRACT_ADDRESS"],
  VITE_REPUTATIONSBT_ADDRESS: ["VITE_REPUTATION_SBT_ADDRESS"],
  VITE_SKILLSBT_ADDRESS: ["VITE_SKILL_SBT_ADDRESS"],
  VITE_TIMELOCK_ADDRESS: ["VITE_TIME_LOCK_ADDRESS"],
  VITE_TREASURY_ADDRESS: ["VITE_TREASURY_ADDRESS"],
  VITE_USERREGISTRY_ADDRESS: ["VITE_USER_REGISTRY_ADDRESS", "VITE_USER_CONTRACT_ADDRESS"],
};

const normalizedContractEnv = { ...contractEnv };
for (const [fromKey, toKeys] of Object.entries(contractKeyAliases)) {
  if (!normalizedContractEnv[fromKey]) continue;
  for (const toKey of toKeys) {
    if (!normalizedContractEnv[toKey]) {
      normalizedContractEnv[toKey] = normalizedContractEnv[fromKey];
    }
  }
}

const contractDefines = Object.fromEntries(
  Object.entries(normalizedContractEnv)
    .filter(([key]) => key.startsWith("VITE_") && key.endsWith("_ADDRESS"))
    .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: {
        theme: {
          extend: {
            fontFamily: {
              sans: ["Inter", "sans-serif"],
              roboto: ["Roboto", "sans-serif"],
            },
          },
        },
      },
    }),
  ],
  define: contractDefines,
  base: "/",
});
