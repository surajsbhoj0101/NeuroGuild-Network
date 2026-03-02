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
  VITE_USERREGISTRY_ADDRESS: "VITE_USER_CONTRACT_ADDRESS",
  VITE_JOBCONTRACT_ADDRESS: "VITE_JOB_CONTRACT_ADDRESS",
  VITE_ERC20USDC_ADDRESS: "VITE_USDC_ADDRESS",
  VITE_REPUTATION_SBT_ADDRESS: "VITE_REPUTATIONSBT_ADDRESS",
};

const normalizedContractEnv = { ...contractEnv };
for (const [fromKey, toKey] of Object.entries(contractKeyAliases)) {
  if (!normalizedContractEnv[toKey] && normalizedContractEnv[fromKey]) {
    normalizedContractEnv[toKey] = normalizedContractEnv[fromKey];
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
