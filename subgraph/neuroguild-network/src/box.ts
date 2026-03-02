import {
  OwnershipTransferred as OwnershipTransferredEvent,
  ValueChanged as ValueChangedEvent,
} from "../generated/Box/Box";

export function handleOwnershipTransferred(_event: OwnershipTransferredEvent): void {}

export function handleValueChanged(_event: ValueChangedEvent): void {}
