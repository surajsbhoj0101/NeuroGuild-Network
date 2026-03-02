import {
  AdminRenounced as AdminRenouncedEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  ProposalCanceled as ProposalCanceledEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  QuorumNumeratorUpdated as QuorumNumeratorUpdatedEvent,
  ReputationContractUpdated as ReputationContractUpdatedEvent,
  TimelockChange as TimelockChangeEvent,
  VoteCast as VoteCastEvent,
  VoteCastWithParams as VoteCastWithParamsEvent,
} from "../generated/GovernanceContract/GovernanceContract";

export function handleAdminRenounced(_event: AdminRenouncedEvent): void {}

export function handleEIP712DomainChanged(_event: EIP712DomainChangedEvent): void {}

export function handleProposalCanceled(_event: ProposalCanceledEvent): void {}

export function handleProposalCreated(_event: ProposalCreatedEvent): void {}

export function handleProposalExecuted(_event: ProposalExecutedEvent): void {}

export function handleProposalQueued(_event: ProposalQueuedEvent): void {}

export function handleQuorumNumeratorUpdated(_event: QuorumNumeratorUpdatedEvent): void {}

export function handleReputationContractUpdated(_event: ReputationContractUpdatedEvent): void {}

export function handleTimelockChange(_event: TimelockChangeEvent): void {}

export function handleVoteCast(_event: VoteCastEvent): void {}

export function handleVoteCastWithParams(_event: VoteCastWithParamsEvent): void {}
