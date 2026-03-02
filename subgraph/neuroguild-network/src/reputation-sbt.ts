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

export function handleBidAccepted(_event: BidAcceptedEvent): void {}

export function handleBidRejected(_event: BidRejectedEvent): void {}

export function handleBidSubmitted(_event: BidSubmittedEvent): void {}

export function handleClaimAfterExpiredDeadlineSuccessful(_event: ClaimAfterExpiredDeadlineSuccessfulEvent): void {}

export function handleClientRated(_event: ClientRatedEvent): void {}

export function handleDisputeRaised(_event: DisputeRaisedEvent): void {}

export function handleDisputeResolved(_event: DisputeResolvedEvent): void {}

export function handleFeeUpdated(_event: FeeUpdatedEvent): void {}

export function handleFreelancerRated(_event: FreelancerRatedEvent): void {}

export function handleFundLocked(_event: FundLockedEvent): void {}

export function handleFundRefunded(_event: FundRefundedEvent): void {}

export function handleFundReleased(_event: FundReleasedEvent): void {}

export function handleJobCancelled(_event: JobCancelledEvent): void {}

export function handleJobCompleted(_event: JobCompletedEvent): void {}

export function handleJobCreated(_event: JobCreatedEvent): void {}

export function handleJobDetailsUpdated(_event: JobDetailsUpdatedEvent): void {}

export function handleJobStarted(_event: JobStartedEvent): void {}

export function handleReputationAddressUpdated(_event: ReputationAddressUpdatedEvent): void {}

export function handleReputationPenaltyUpdated(_event: ReputationPenaltyUpdatedEvent): void {}

export function handleReputationRewardUpdated(_event: ReputationRewardUpdatedEvent): void {}

export function handleReviewPeriodUpdated(_event: ReviewPeriodUpdatedEvent): void {}

export function handleTimelockUpdated(_event: TimelockUpdatedEvent): void {}

export function handleTreasuryUpdated(_event: TreasuryUpdatedEvent): void {}

export function handleWorkSubmitted(_event: WorkSubmittedEvent): void {}
