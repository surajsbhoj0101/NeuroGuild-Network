import {
  Job,
  Bid,
  JobCreated,
  JobDetailsUpdated,
  JobStarted,
  JobCompleted,
  JobCancelled,
  BidSubmitted,
  BidAccepted,
  BidRejected,
  WorkSubmitted,
  DisputeRaised,
  DisputeResolved,
  FundLocked,
  FundReleased,
  FundRefunded,
} from "../generated/schema";

import {
  BidAccepted as BidAcceptedEvent,
  BidRejected as BidRejectedEvent,
  BidSubmitted as BidSubmittedEvent,
  ClaimAfterExpiredDeadlineSuccessful as ClaimAfterExpiredDeadlineSuccessfulEvent,
  ClientRated as ClientRatedEvent,
  DisputeRaised as DisputeRaisedEvent,
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

/* ----------------------------- JOB CREATED ----------------------------- */

export function handleJobCreated(event: JobCreatedEvent): void {
  let jobId = event.params.jobId.toHex();
  let job = new Job(jobId);

  job.client = event.params.client;
  job.freelancer = null;

  job.status = "OPEN";
  job.bidCount = 0;

  job.budget = event.params.budget;
  job.bidDeadline = event.params.bidDeadline;
  job.expireDeadline = event.params.expireDeadline;

  job.ipfsHash = event.params.ipfs;
  job.ipfsProof = null;

  job.createdAt = event.block.timestamp;
  job.submittedAt = null;
  job.completedAt = null;

  job.fundLockedAt = null;
  job.fundReleasedAt = null;
  job.fundRefundedAt = null;

  job.fundLockedAmount = null;
  job.fundReleasedAmount = null;
  job.fundRefundedAmount = null;

  job.save();

  let evt = new JobCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.client = event.params.client;
  evt.budget = event.params.budget;
  evt.bidDeadline = event.params.bidDeadline;
  evt.expireDeadline = event.params.expireDeadline;
  evt.ipfs = event.params.ipfs;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ------------------------- JOB DETAILS UPDATED -------------------------- */

export function handleJobDetailsUpdated(event: JobDetailsUpdatedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.budget = event.params.budget;
  job.bidDeadline = event.params.bidDeadline;
  job.expireDeadline = event.params.expireDeadline;
  job.ipfsHash = event.params.ipfs;
  job.save();

  let evt = new JobDetailsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.client = event.params.client;
  evt.budget = event.params.budget;
  evt.bidDeadline = event.params.bidDeadline;
  evt.expireDeadline = event.params.expireDeadline;
  evt.ipfs = event.params.ipfs;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ----------------------------- JOB STARTED ------------------------------ */

export function handleJobStarted(event: JobStartedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.freelancer = event.params.freelancer;
  job.status = "IN_PROGRESS";
  job.save();

  let evt = new JobStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- WORK SUBMITTED ---------------------------- */

export function handleWorkSubmitted(event: WorkSubmittedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.ipfsProof = event.params.ipfsProof;
  job.submittedAt = event.block.timestamp;
  job.status = "SUBMITTED";
  job.save();

  let evt = new WorkSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.ipfsProof = event.params.ipfsProof;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- JOB COMPLETED ----------------------------- */

export function handleJobCompleted(event: JobCompletedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.status = "COMPLETED";
  job.completedAt = event.block.timestamp;
  job.save();

  let evt = new JobCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- JOB CANCELLED ----------------------------- */

export function handleJobCancelled(event: JobCancelledEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.status = "CANCELLED";
  job.save();

  let evt = new JobCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.client = event.params.client;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- BID SUBMITTED ----------------------------- */

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  let bidId =
    event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = new Bid(bidId);

  bid.job = job.id;
  bid.bidder = event.params.freelancer;
  bid.status = "PENDING";
  bid.amount = event.params.amount;
  bid.createdAt = event.block.timestamp;
  bid.ipfsProposal = event.params.proposalIpfs;
  bid.save();

  job.bidCount = job.bidCount + 1;
  job.save();

  let evt = new BidSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.amount = event.params.amount;
  evt.bidIndex = event.params.bidIndex;
  evt.proposalIpfs = event.params.proposalIpfs;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- BID ACCEPTED ------------------------------ */

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  let bidId =
    event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = Bid.load(bidId);
  if (bid) {
    bid.status = "ACCEPTED";
    bid.save();
  }

  job.freelancer = event.params.freelancer;
  job.status = "IN_PROGRESS";
  job.save();

  let evt = new BidAccepted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.amount = event.params.amount;
  evt.bidIndex = event.params.bidIndex;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- BID REJECTED ------------------------------ */

export function handleBidRejected(event: BidRejectedEvent): void {
  let bidId =
    event.params.jobId.toHex() + "-" + event.params.bidIndex.toString();
  let bid = Bid.load(bidId);
  if (bid) {
    bid.status = "REJECTED";
    bid.save();
  }

  let evt = new BidRejected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.amount = event.params.amount;
  evt.bidIndex = event.params.bidIndex;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ---------------------------- DISPUTES ---------------------------------- */

export function handleDisputeRaised(event: DisputeRaisedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (job) {
    job.status = "DISPUTED";
    job.save();
  }

  let evt = new DisputeRaised(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.by = event.params.by;
  evt.reasonIpfs = event.params.reasonIpfs;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let evt = new DisputeResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.winner = event.params.winner;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

/* ------------------------------ FUNDS ----------------------------------- */

export function handleFundLocked(event: FundLockedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.fundLockedAt = event.block.timestamp;
  job.fundLockedAmount = event.params.amountLocked;
  job.save();

  let evt = new FundLocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.amountLocked = event.params.amountLocked;
  evt.bidAmount = event.params.bidAmount;
  evt.client = event.params.client;
  evt.freelancer = event.params.freelancer;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleFundReleased(event: FundReleasedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.fundReleasedAt = event.block.timestamp;
  job.fundReleasedAmount = event.params.amountToFreelancer;
  job.save();

  let evt = new FundReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.amountToFreelancer = event.params.amountToFreelancer;
  evt.feeToTreasury = event.params.feeToTreasury;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleFundRefunded(event: FundRefundedEvent): void {
  let job = Job.load(event.params.jobId.toHex());
  if (!job) return;

  job.fundRefundedAt = event.block.timestamp;
  job.fundRefundedAmount = event.params.amountRefunded;
  job.save();

  let evt = new FundRefunded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.amountRefunded = event.params.amountRefunded;
  evt.client = event.params.client;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleClaimAfterExpiredDeadlineSuccessful(
  _event: ClaimAfterExpiredDeadlineSuccessfulEvent
): void {}

export function handleClientRated(_event: ClientRatedEvent): void {}

export function handleFeeUpdated(_event: FeeUpdatedEvent): void {}

export function handleFreelancerRated(_event: FreelancerRatedEvent): void {}

export function handleReputationAddressUpdated(
  _event: ReputationAddressUpdatedEvent
): void {}

export function handleReputationPenaltyUpdated(
  _event: ReputationPenaltyUpdatedEvent
): void {}

export function handleReputationRewardUpdated(
  _event: ReputationRewardUpdatedEvent
): void {}

export function handleReviewPeriodUpdated(_event: ReviewPeriodUpdatedEvent): void {}

export function handleTimelockUpdated(_event: TimelockUpdatedEvent): void {}

export function handleTreasuryUpdated(_event: TreasuryUpdatedEvent): void {}
