import dotenv from "dotenv";
import { Contract, JsonRpcProvider, Wallet, id } from "ethers";
import { SkillSBT } from "../abis/SkillSBT.js";
import { CouncilRegistry } from "../abis/CouncilRegistry.js";

dotenv.config();
dotenv.config({ path: "./contract.env" });

const RPC_URL = process.env.RPC_URL;
const SKILL_SBT_ADDRESS =
  process.env.SKILLSBT_ADDRESS || process.env.SKILL_SBT_ADDRESS;
const COUNCIL_REGISTRY_ADDRESS = process.env.COUNCILREGISTRY_ADDRESS;
const DEFAULT_COUNCIL_CONFIDENCE = Number(
  process.env.DEFAULT_SKILL_COUNCIL_CONFIDENCE || 60
);

const provider = RPC_URL ? new JsonRpcProvider(RPC_URL) : null;

export const SKILL_LEVEL_LABELS = ["Beginner", "Intermediate", "Advance"];

export function getSkillId(skillName) {
  return id(skillName.trim());
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

export function calculateSkillLevel(aiScore, councilConfidence) {
  const total = clampScore(aiScore) + clampScore(councilConfidence);
  if (total <= 80) return 0;
  if (total <= 160) return 1;
  return 2;
}

export function getSkillLevelLabel(level) {
  return SKILL_LEVEL_LABELS[Number(level)] || SKILL_LEVEL_LABELS[0];
}

export function getDefaultCouncilConfidence() {
  return clampScore(DEFAULT_COUNCIL_CONFIDENCE);
}

export function getSkillSbtReadContract() {
  if (!provider || !SKILL_SBT_ADDRESS) return null;
  return new Contract(SKILL_SBT_ADDRESS, SkillSBT, provider);
}

export function getCouncilRegistryReadContract() {
  if (!provider || !COUNCIL_REGISTRY_ADDRESS) return null;
  return new Contract(COUNCIL_REGISTRY_ADDRESS, CouncilRegistry, provider);
}

export function getBackendCouncilSigner() {
  if (!provider || !process.env.PRIVATE_KEY) return null;
  return new Wallet(process.env.PRIVATE_KEY, provider);
}

export function getSkillSbtWriteContract() {
  const signer = getBackendCouncilSigner();
  if (!signer || !SKILL_SBT_ADDRESS) return null;
  return new Contract(SKILL_SBT_ADDRESS, SkillSBT, signer);
}

export async function backendSignerIsCouncil() {
  const signer = getBackendCouncilSigner();
  const registry = getCouncilRegistryReadContract();

  if (!signer || !registry) return false;
  return registry.isCouncil(signer.address);
}

export async function walletAlreadyHasSkill(walletAddress, skillName) {
  const contract = getSkillSbtReadContract();
  if (!contract || !walletAddress) return false;
  return contract.hasSkill(walletAddress, getSkillId(skillName));
}

export async function mintSkillOnChain({
  walletAddress,
  skillName,
  aiScore,
  councilConfidence,
  metadataURI,
}) {
  const contract = getSkillSbtWriteContract();
  const signer = getBackendCouncilSigner();

  if (!contract || !signer) {
    throw new Error("Skill SBT signer is not configured.");
  }

  const tx = await contract.mintSkill(
    walletAddress,
    getSkillId(skillName),
    clampScore(aiScore),
    clampScore(councilConfidence),
    metadataURI
  );
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "SkillMinted");

  return {
    receipt,
    txHash: receipt.hash,
    tokenId: event?.args?.tokenId?.toString?.() || null,
    reviewerWallet: signer.address,
  };
}
