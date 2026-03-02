import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  BatchMetadataUpdate as BatchMetadataUpdateEvent,
  CouncilRegistryUpdated as CouncilRegistryUpdatedEvent,
  MetadataUpdate as MetadataUpdateEvent,
  SkillMinted as SkillMintedEvent,
  SkillUpgraded as SkillUpgradedEvent,
  Transfer as TransferEvent,
} from "../generated/SkillSBT/SkillSBT";

export function handleApproval(_event: ApprovalEvent): void {}

export function handleApprovalForAll(_event: ApprovalForAllEvent): void {}

export function handleBatchMetadataUpdate(_event: BatchMetadataUpdateEvent): void {}

export function handleCouncilRegistryUpdated(
  _event: CouncilRegistryUpdatedEvent
): void {}

export function handleMetadataUpdate(_event: MetadataUpdateEvent): void {}

export function handleSkillMinted(_event: SkillMintedEvent): void {}

export function handleSkillUpgraded(_event: SkillUpgradedEvent): void {}

export function handleTransfer(_event: TransferEvent): void {}
