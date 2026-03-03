import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  CouncilRegistryUpdated as CouncilRegistryUpdatedEvent,
  SkillMinted as SkillMintedEvent,
  SkillUpgraded as SkillUpgradedEvent,
  Transfer as TransferEvent,
} from "../generated/SkillSBT/SkillSBT";
import {
  ProtocolConfig,
  SkillMintedHistory,
  SkillOperatorApproval,
  SkillToken,
  SkillTransferHistory,
  SkillUpgradedHistory,
} from "../generated/schema";
import { BigInt, dataSource } from "@graphprotocol/graph-ts";

function tokenAddress(): string {
  return dataSource.address().toHex();
}

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

export function handleApproval(event: ApprovalEvent): void {
  let skill = SkillToken.load(event.params.tokenId.toString());
  if (skill == null) return;

  skill.approved = event.params.approved;
  skill.updatedAt = event.block.timestamp;
  skill.save();
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let id = tokenAddress() + "-" + event.params.owner.toHex() + "-" + event.params.operator.toHex();
  let op = SkillOperatorApproval.load(id);
  if (op == null) {
    op = new SkillOperatorApproval(id);
    op.token = dataSource.address();
    op.owner = event.params.owner;
    op.operator = event.params.operator;
    op.createdAt = event.block.timestamp;
  }
  op.approved = event.params.approved;
  op.updatedAt = event.block.timestamp;
  op.save();
}

export function handleCouncilRegistryUpdated(
  event: CouncilRegistryUpdatedEvent
): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.councilRegistry = event.params.newRegistry;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleSkillMinted(event: SkillMintedEvent): void {
  let token = new SkillToken(event.params.tokenId.toString());
  token.tokenId = event.params.tokenId;
  token.owner = event.params.user;
  token.skillId = event.params.skillId;
  token.aiScore = event.params.aiScore;
  token.councilConfidence = event.params.councilConfidence;
  token.level = event.params.level;
  token.metadataURI = event.params.metadataURI;
  token.approved = null;
  token.createdAt = event.block.timestamp;
  token.updatedAt = event.block.timestamp;
  token.save();

  let h = new SkillMintedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.tokenId = event.params.tokenId;
  h.user = event.params.user;
  h.skillId = event.params.skillId;
  h.aiScore = event.params.aiScore;
  h.councilConfidence = event.params.councilConfidence;
  h.level = event.params.level;
  h.metadataURI = event.params.metadataURI;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleSkillUpgraded(event: SkillUpgradedEvent): void {
  let token = SkillToken.load(event.params.tokenId.toString());
  if (token != null) {
    token.level = event.params.newLevel;
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  let h = new SkillUpgradedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.tokenId = event.params.tokenId;
  h.oldLevel = event.params.oldLevel;
  h.newLevel = event.params.newLevel;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleTransfer(event: TransferEvent): void {
  let token = SkillToken.load(event.params.tokenId.toString());
  if (token != null) {
    token.owner = event.params.to;
    token.approved = null;
    token.updatedAt = event.block.timestamp;
    token.save();
  }

  let h = new SkillTransferHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.token = dataSource.address();
  h.from = event.params.from;
  h.to = event.params.to;
  h.tokenId = event.params.tokenId;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}
