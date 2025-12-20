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
  JobCreated as JobCreatedEvent,
  JobDetailsUpdated as JobDetailsUpdatedEvent,
  JobStarted as JobStartedEvent,
  JobCompleted as JobCompletedEvent,
  JobCancelled as JobCancelledEvent,
  BidSubmitted as BidSubmittedEvent,
  BidAccepted as BidAcceptedEvent,
  BidRejected as BidRejectedEvent,
  WorkSubmitted as WorkSubmittedEvent,
  DisputeRaised as DisputeRaisedEvent,
  DisputeResolved as DisputeResolvedEvent,
  FundLocked as FundLockedEvent,
  FundReleased as FundReleasedEvent,
  FundRefunded as FundRefundedEvent,
} from "../generated/JobContract/JobContract";

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

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let bidId = event.params.jobId
    .toHex()
    .concat("-")
    .concat(event.params.bidIndex.toString());

  let bid = new Bid(bidId);
  bid.job = event.params.jobId.toHex();
  bid.bidder = event.params.freelancer;
  bid.status = "PENDING";
  bid.amount = event.params.amount;
  bid.createdAt = event.block.timestamp;
  bid.ipfsProposal = event.params.proposalIpfs;
  bid.save();

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

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let bidId = event.params.jobId
    .toHex()
    .concat("-")
    .concat(event.params.bidIndex.toString());

  let bid = Bid.load(bidId);
  if (bid) {
    bid.status = "ACCEPTED";
    bid.save();
  }

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

export function handleBidRejected(event: BidRejectedEvent): void {
  let bidId = event.params.jobId
    .toHex()
    .concat("-")
    .concat(event.params.bidIndex.toString());

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
