import {
  CouncilPaid as CouncilPaidEvent,
  CouncilRegistryUpdated as CouncilRegistryUpdatedEvent,
  CouncilRewardAdded as CouncilRewardAddedEvent,
  DeveloperPaid as DeveloperPaidEvent,
  DeveloperRewardAdded as DeveloperRewardAddedEvent,
  EmergencyWithdrawn as EmergencyWithdrawnEvent,
  ProtocolFeeReceived as ProtocolFeeReceivedEvent,
  TimelockUpdated as TimelockUpdatedEvent,
} from "../generated/Treasury/Treasury";

export function handleCouncilPaid(_event: CouncilPaidEvent): void {}

export function handleCouncilRegistryUpdated(_event: CouncilRegistryUpdatedEvent): void {}

export function handleCouncilRewardAdded(_event: CouncilRewardAddedEvent): void {}

export function handleDeveloperPaid(_event: DeveloperPaidEvent): void {}

export function handleDeveloperRewardAdded(_event: DeveloperRewardAddedEvent): void {}

export function handleEmergencyWithdrawn(_event: EmergencyWithdrawnEvent): void {}

export function handleProtocolFeeReceived(_event: ProtocolFeeReceivedEvent): void {}

export function handleTimelockUpdated(_event: TimelockUpdatedEvent): void {}
