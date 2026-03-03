import {
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
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Proposal, ProposalVoteHistory, ProtocolConfig } from "../generated/schema";

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

function proposalId(id: BigInt): string {
  return id.toString();
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let id = proposalId(event.params.proposalId);
  let proposal = new Proposal(id);

  let targets = new Array<Bytes>(event.params.targets.length);
  for (let i = 0; i < event.params.targets.length; i++) {
    targets[i] = event.params.targets[i];
  }

  proposal.proposer = event.params.proposer;
  proposal.targets = targets;
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.voteStart = event.params.voteStart;
  proposal.voteEnd = event.params.voteEnd;
  proposal.etaSeconds = null;
  proposal.description = event.params.description;
  proposal.status = "CREATED";
  proposal.createdAt = event.block.timestamp;
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  let proposal = Proposal.load(proposalId(event.params.proposalId));
  if (proposal == null) return;

  proposal.status = "CANCELED";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let proposal = Proposal.load(proposalId(event.params.proposalId));
  if (proposal == null) return;

  proposal.status = "EXECUTED";
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleProposalQueued(event: ProposalQueuedEvent): void {
  let proposal = Proposal.load(proposalId(event.params.proposalId));
  if (proposal == null) return;

  proposal.status = "QUEUED";
  proposal.etaSeconds = event.params.etaSeconds;
  proposal.updatedAt = event.block.timestamp;
  proposal.save();
}

export function handleVoteCast(event: VoteCastEvent): void {
  let proposal = Proposal.load(proposalId(event.params.proposalId));
  if (proposal == null) return;

  let vote = new ProposalVoteHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  vote.proposal = proposal.id;
  vote.voter = event.params.voter;
  vote.support = event.params.support;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;
  vote.params = null;
  vote.blockNumber = event.block.number;
  vote.transactionHash = event.transaction.hash;
  vote.timestamp = event.block.timestamp;
  vote.save();
}

export function handleVoteCastWithParams(event: VoteCastWithParamsEvent): void {
  let proposal = Proposal.load(proposalId(event.params.proposalId));
  if (proposal == null) return;

  let vote = new ProposalVoteHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  vote.proposal = proposal.id;
  vote.voter = event.params.voter;
  vote.support = event.params.support;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;
  vote.params = event.params.params;
  vote.blockNumber = event.block.number;
  vote.transactionHash = event.transaction.hash;
  vote.timestamp = event.block.timestamp;
  vote.save();
}

export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdatedEvent
): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.quorumNumerator = event.params.newQuorumNumerator;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleReputationContractUpdated(
  event: ReputationContractUpdatedEvent
): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.reputationContract = event.params.newReputation;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleTimelockChange(event: TimelockChangeEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.timelock = event.params.newTimelock;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}
