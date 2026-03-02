import {
  CallExecuted as CallExecutedEvent,
  CallSalt as CallSaltEvent,
  CallScheduled as CallScheduledEvent,
  Cancelled as CancelledEvent,
  MinDelayChange as MinDelayChangeEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/Timelock/Timelock";

export function handleCallExecuted(_event: CallExecutedEvent): void {}

export function handleCallSalt(_event: CallSaltEvent): void {}

export function handleCallScheduled(_event: CallScheduledEvent): void {}

export function handleCancelled(_event: CancelledEvent): void {}

export function handleMinDelayChange(_event: MinDelayChangeEvent): void {}

export function handleRoleAdminChanged(_event: RoleAdminChangedEvent): void {}

export function handleRoleGranted(_event: RoleGrantedEvent): void {}

export function handleRoleRevoked(_event: RoleRevokedEvent): void {}
