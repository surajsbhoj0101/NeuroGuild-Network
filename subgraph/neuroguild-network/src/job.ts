import {
  Job,
  JobBid,
  JobDispute,
  ProtocolConfig,
  JobBidSubmittedHistory,
  JobBidAcceptedHistory,
  JobBidRejectedHistory,
  WorkSubmittedHistory,
  JobCompletedHistory,
  JobCancelledHistory,
  DisputeRaisedHistory,
  DisputeResolvedHistory,
  FundLockedHistory,
  FundReleasedHistory,
  FundRefundedHistory,
  ClientRatedHistory,
  FreelancerRatedHistory,
} from "../generated/schema";

import {
  BidAccepted as BidAcceptedEvent,
  BidRejected as BidRejectedEvent,
  BidSubmitted as BidSubmittedEvent,
  ClaimAfterExpiredDeadlineSuccessful as ClaimAfterExpiredDeadlineSuccessfulEvent,
  ClientRated as ClientRatedEvent,
  DisputeRaised as DisputeRaisedEvent,
  DisputeReRaised as DisputeReRaisedEvent,
  DisputeResolved as DisputeResolvedEvent,
  FeeUpdated as FeeUpdatedEvent,
  FreelancerRated as FreelancerRatedEvent,
  FundLocked as FundLockedEvent,
  FundRefunded as FundRefundedEvent,
  FundReleased as FundReleasedEvent,
  JobCancelled as JobCancelledEvent,
  JobCompleted as JobCompletedEvent,
  JobCreated as JobCreatedEvent,
  JobDetailsUpdated as JobDetailsUpdatedEvent,
  JobStarted as JobStartedEvent,
  ReputationAddressUpdated as ReputationAddressUpdatedEvent,
  ReputationPenaltyUpdated as ReputationPenaltyUpdatedEvent,
  ReputationRewardUpdated as ReputationRewardUpdatedEvent,
  ReviewPeriodUpdated as ReviewPeriodUpdatedEvent,
  TimelockUpdated as TimelockUpdatedEvent,
  TreasuryUpdated as TreasuryUpdatedEvent,
  WorkSubmitted as WorkSubmittedEvent,
} from "../generated/JobContract/JobContract";
import { BigInt } from "@graphprotocol/graph-ts";

function historyId(txHash: string, logIndex: string): string {
  return txHash + "-" + logIndex;
}

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

export function handleJobCreated(event: JobCreatedEvent): void {
  let jobId = event.params.jobId.toHex();
  let job = new Job(jobId);
  job.client = event.params.client;
  job.freelancer = null;
  job.status = "OPEN";
  job.budget = event.params.budget;
  job.bidDeadline = event.params.bidDeadline;
  job.expireDeadline = event.params.expireDeadline;
  job.ipfsHash = event.params.ipfs;
  job.ipfsProof = [];
  job.submittedAt = null;
  job.completedAt = null;
  job.fundLockedAt = null;
  job.fundReleasedAt = null;
  job.fundRefundedAt = null;
  job.fundLockedAmount = null;
  job.fundReleasedAmount = null;
  job.fundRefundedAmount = null;
  job.bidCount = 0;
  job.createdAt = event.block.timestamp;
  job.updatedAt = event.block.timestamp;
  job.save();
}

export function handleJobDetailsUpdated(event: JobDetailsUpdatedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;
  job.budget = event.params.budget;
  job.bidDeadline = event.params.bidDeadline;
  job.expireDeadline = event.params.expireDeadline;
  job.ipfsHash = event.params.ipfs;
  job.updatedAt = event.block.timestamp;
  job.save();
}

export function handleJobStarted(event: JobStartedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;
  job.freelancer = event.params.freelancer;
  job.status = "IN_PROGRESS";
  job.updatedAt = event.block.timestamp;
  job.save();
}

export function handleWorkSubmitted(event: WorkSubmittedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  let proofs = job.ipfsProof;
  if (proofs == null) {
    proofs = [];
  }
  proofs.push(event.params.ipfsProof);
  job.ipfsProof = proofs;
  job.submittedAt = event.block.timestamp;
  job.status = "SUBMITTED";
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new WorkSubmittedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.ipfsProof = event.params.ipfsProof;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleJobCompleted(event: JobCompletedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.status = "COMPLETED";
  job.completedAt = event.block.timestamp;
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new JobCompletedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleJobCancelled(event: JobCancelledEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.status = "CANCELLED";
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new JobCancelledHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.client = event.params.client;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  let bidId = event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = new JobBid(bidId);
  bid.job = job.id;
  bid.bidIndex = event.params.bidIndex;
  bid.freelancer = event.params.freelancer;
  bid.amount = event.params.amount;
  bid.proposalIpfs = event.params.proposalIpfs;
  bid.status = "PENDING";
  bid.createdAt = event.block.timestamp;
  bid.updatedAt = event.block.timestamp;
  bid.save();

  job.bidCount = job.bidCount + 1;
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new JobBidSubmittedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.amount = event.params.amount;
  h.bidIndex = event.params.bidIndex;
  h.proposalIpfs = event.params.proposalIpfs;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  let bidId = event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = JobBid.load(bidId);
  if (bid != null) {
    bid.status = "ACCEPTED";
    bid.updatedAt = event.block.timestamp;
    bid.save();
  }

  job.freelancer = event.params.freelancer;
  job.status = "IN_PROGRESS";
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new JobBidAcceptedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.amount = event.params.amount;
  h.bidIndex = event.params.bidIndex;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleBidRejected(event: BidRejectedEvent): void {
  let bidId = event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = JobBid.load(bidId);
  if (bid != null) {
    bid.status = "REJECTED";
    bid.updatedAt = event.block.timestamp;
    bid.save();
  }

  let h = new JobBidRejectedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.amount = event.params.amount;
  h.bidIndex = event.params.bidIndex;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleDisputeRaised(event: DisputeRaisedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job != null) {
    job.status = "DISPUTED";
    job.updatedAt = event.block.timestamp;
    job.save();
  }

  let dispute = JobDispute.load(event.params.jobId.toHex());
  if (dispute == null) {
    dispute = new JobDispute(event.params.jobId.toHex());
    dispute.job = event.params.jobId.toHex();
    dispute.createdAt = event.block.timestamp;
  }
  dispute.status = "OPEN";
  dispute.raisedBy = event.params.by;
  dispute.reasonIpfs = event.params.reasonIpfs;
  dispute.winner = null;
  dispute.resolvedAt = null;
  dispute.updatedAt = event.block.timestamp;
  dispute.save();

  let h = new DisputeRaisedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.by = event.params.by;
  h.reasonIpfs = event.params.reasonIpfs;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleDisputeReRaised(event: DisputeReRaisedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job != null) {
    job.status = "DISPUTED";
    job.updatedAt = event.block.timestamp;
    job.save();
  }

  let dispute = JobDispute.load(event.params.jobId.toHex());
  if (dispute == null) {
    dispute = new JobDispute(event.params.jobId.toHex());
    dispute.job = event.params.jobId.toHex();
    dispute.createdAt = event.block.timestamp;
  }
  dispute.status = "OPEN";
  dispute.raisedBy = event.params.by;
  dispute.reasonIpfs = event.params.reasonIpfs;
  dispute.winner = null;
  dispute.resolvedAt = null;
  dispute.updatedAt = event.block.timestamp;
  dispute.save();

  let h = new DisputeRaisedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.by = event.params.by;
  h.reasonIpfs = event.params.reasonIpfs;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let dispute = JobDispute.load(event.params.jobId.toHex());
  if (dispute != null) {
    dispute.status = "RESOLVED";
    dispute.winner = event.params.winner;
    dispute.resolvedAt = event.block.timestamp;
    dispute.updatedAt = event.block.timestamp;
    dispute.save();
  }

  let h = new DisputeResolvedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.winner = event.params.winner;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleFundLocked(event: FundLockedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.fundLockedAt = event.block.timestamp;
  job.fundLockedAmount = event.params.amountLocked;
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new FundLockedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.amountLocked = event.params.amountLocked;
  h.bidAmount = event.params.bidAmount;
  h.client = event.params.client;
  h.freelancer = event.params.freelancer;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleFundReleased(event: FundReleasedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.fundReleasedAt = event.block.timestamp;
  job.fundReleasedAmount = event.params.amountToFreelancer;
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new FundReleasedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.amountToFreelancer = event.params.amountToFreelancer;
  h.feeToTreasury = event.params.feeToTreasury;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleFundRefunded(event: FundRefundedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.fundRefundedAt = event.block.timestamp;
  job.fundRefundedAmount = event.params.amountRefunded;
  job.updatedAt = event.block.timestamp;
  job.save();

  let h = new FundRefundedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.amountRefunded = event.params.amountRefunded;
  h.client = event.params.client;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleClaimAfterExpiredDeadlineSuccessful(
  event: ClaimAfterExpiredDeadlineSuccessfulEvent
): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job == null) return;

  job.status = "CANCELLED";
  job.updatedAt = event.block.timestamp;
  job.save();
}

export function handleClientRated(event: ClientRatedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job != null) {
    job.clientRating = event.params.rating;
    job.updatedAt = event.block.timestamp;
    job.save();
  }

  let h = new ClientRatedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.freelancer = event.params.freelancer;
  h.client = event.params.client;
  h.rating = event.params.rating;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleFreelancerRated(event: FreelancerRatedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job != null) {
    job.freelancerRating = event.params.rating;
    job.updatedAt = event.block.timestamp;
    job.save();
  }

  let h = new FreelancerRatedHistory(
    historyId(event.transaction.hash.toHex(), event.logIndex.toString())
  );
  h.jobId = event.params.jobId;
  h.client = event.params.client;
  h.freelancer = event.params.freelancer;
  h.rating = event.params.rating;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleFeeUpdated(event: FeeUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.clientFeeBps = event.params.newClientFeeBps;
  cfg.protocolFeeBps = event.params.newProtocolFeeBps;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleReputationAddressUpdated(
  event: ReputationAddressUpdatedEvent
): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.reputationContract = event.params.newReputation;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleReputationPenaltyUpdated(
  _event: ReputationPenaltyUpdatedEvent
): void {}

export function handleReputationRewardUpdated(
  _event: ReputationRewardUpdatedEvent
): void {}

export function handleReviewPeriodUpdated(event: ReviewPeriodUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.reviewPeriod = event.params.newReviewPeriod;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleTimelockUpdated(event: TimelockUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.timelock = event.params.newTimelock;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.treasury = event.params.newTreasury;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}
