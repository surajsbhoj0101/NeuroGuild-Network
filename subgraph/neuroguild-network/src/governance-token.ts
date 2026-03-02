import {
  Approval as ApprovalEvent,
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent,
} from "../generated/GovernanceToken/GovernanceToken";

export function handleApproval(_event: ApprovalEvent): void {}

export function handleDelegateChanged(_event: DelegateChangedEvent): void {}

export function handleDelegateVotesChanged(_event: DelegateVotesChangedEvent): void {}

export function handleEIP712DomainChanged(_event: EIP712DomainChangedEvent): void {}

export function handleOwnershipTransferred(_event: OwnershipTransferredEvent): void {}

export function handleTransfer(_event: TransferEvent): void {}
