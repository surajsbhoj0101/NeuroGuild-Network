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
} from "../generated/ReputationSBT/ReputationSBT";
import {
  BidAccepted,
  BidRejected,
  BidSubmitted,
  ClaimAfterExpiredDeadlineSuccessful,
  ClientRated,
  DisputeRaised,
  DisputeResolved,
  FeeUpdated,
  FreelancerRated,
  FundLocked,
  FundRefunded,
  FundReleased,
  JobCancelled,
  JobCompleted,
  JobCreated,
  JobDetailsUpdated,
  JobStarted,
  ReputationAddressUpdated,
  ReputationPenaltyUpdated,
  ReputationRewardUpdated,
  ReviewPeriodUpdated,
  TimelockUpdated,
  TreasuryUpdated,
  WorkSubmitted,
} from "../generated/schema";

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let evt = new BidAccepted(event.transaction.hash.concatI32(event.logIndex.toI32()));
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
  let evt = new BidRejected(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.amount = event.params.amount;
  evt.bidIndex = event.params.bidIndex;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let evt = new BidSubmitted(event.transaction.hash.concatI32(event.logIndex.toI32()));
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

export function handleClaimAfterExpiredDeadlineSuccessful(
  event: ClaimAfterExpiredDeadlineSuccessfulEvent
): void {
  let evt = new ClaimAfterExpiredDeadlineSuccessful(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleClientRated(event: ClientRatedEvent): void {
  let evt = new ClientRated(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.client = event.params.client;
  evt.rating = event.params.rating;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleDisputeRaised(event: DisputeRaisedEvent): void {
  let evt = new DisputeRaised(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.by = event.params.by;
  evt.reasonIpfs = event.params.reasonIpfs;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let evt = new DisputeResolved(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.winner = event.params.winner;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleFeeUpdated(event: FeeUpdatedEvent): void {
  let evt = new FeeUpdated(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.oldClientFeeBps = event.params.oldClientFeeBps;
  evt.newClientFeeBps = event.params.newClientFeeBps;
  evt.oldProtocolFeeBps = event.params.oldProtocolFeeBps;
  evt.newProtocolFeeBps = event.params.newProtocolFeeBps;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleFreelancerRated(event: FreelancerRatedEvent): void {
  let evt = new FreelancerRated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.jobId = event.params.jobId;
  evt.client = event.params.client;
  evt.freelancer = event.params.freelancer;
  evt.rating = event.params.rating;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleFundLocked(event: FundLockedEvent): void {
  let evt = new FundLocked(event.transaction.hash.concatI32(event.logIndex.toI32()));
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

export function handleFundRefunded(event: FundRefundedEvent): void {
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

export function handleFundReleased(event: FundReleasedEvent): void {
  let evt = new FundReleased(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.amountToFreelancer = event.params.amountToFreelancer;
  evt.feeToTreasury = event.params.feeToTreasury;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleJobCancelled(event: JobCancelledEvent): void {
  let evt = new JobCancelled(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.client = event.params.client;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleJobCompleted(event: JobCompletedEvent): void {
  let evt = new JobCompleted(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleJobCreated(event: JobCreatedEvent): void {
  let evt = new JobCreated(event.transaction.hash.concatI32(event.logIndex.toI32()));
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
  let evt = new JobStarted(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleReputationAddressUpdated(
  event: ReputationAddressUpdatedEvent
): void {
  let evt = new ReputationAddressUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldReputation = event.params.oldReputation;
  evt.newReputation = event.params.newReputation;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleReputationPenaltyUpdated(
  event: ReputationPenaltyUpdatedEvent
): void {
  let evt = new ReputationPenaltyUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldPenalty = event.params.oldPenalty;
  evt.newPenalty = event.params.newPenalty;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleReputationRewardUpdated(
  event: ReputationRewardUpdatedEvent
): void {
  let evt = new ReputationRewardUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldReward = event.params.oldReward;
  evt.newReward = event.params.newReward;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleReviewPeriodUpdated(event: ReviewPeriodUpdatedEvent): void {
  let evt = new ReviewPeriodUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldReviewPeriod = event.params.oldReviewPeriod;
  evt.newReviewPeriod = event.params.newReviewPeriod;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleTimelockUpdated(event: TimelockUpdatedEvent): void {
  let evt = new TimelockUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldTimelock = event.params.oldTimelock;
  evt.newTimelock = event.params.newTimelock;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let evt = new TreasuryUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  evt.oldTreasury = event.params.oldTreasury;
  evt.newTreasury = event.params.newTreasury;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}

export function handleWorkSubmitted(event: WorkSubmittedEvent): void {
  let evt = new WorkSubmitted(event.transaction.hash.concatI32(event.logIndex.toI32()));
  evt.jobId = event.params.jobId;
  evt.freelancer = event.params.freelancer;
  evt.ipfsProof = event.params.ipfsProof;
  evt.blockNumber = event.block.number;
  evt.blockTimestamp = event.block.timestamp;
  evt.transactionHash = event.transaction.hash;
  evt.save();
}
