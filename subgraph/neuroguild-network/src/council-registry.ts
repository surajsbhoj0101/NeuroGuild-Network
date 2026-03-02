import {
  CouncilAdded as CouncilAddedEvent,
  CouncilRemoved as CouncilRemovedEvent,
  TimelockUpdated as TimelockUpdatedEvent,
} from "../generated/CouncilRegistry/CouncilRegistry";

export function handleCouncilAdded(_event: CouncilAddedEvent): void {}

export function handleCouncilRemoved(_event: CouncilRemovedEvent): void {}

export function handleTimelockUpdated(_event: TimelockUpdatedEvent): void {}
