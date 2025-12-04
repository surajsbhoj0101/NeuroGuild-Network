import {
  BidAccepted as BidAcceptedEvent,
  BidRejected as BidRejectedEvent,
  BidSubmitted as BidSubmittedEvent,
  ClaimAfterExpiredDeadlineSuccessful as ClaimAfterExpiredDeadlineSuccessfulEvent,
  DisputeRaised as DisputeRaisedEvent,
  DisputeResolved as DisputeResolvedEvent,
  FundLocked as FundLockedEvent,
  FundReleased as FundReleasedEvent,
  JobCancelled as JobCancelledEvent,
  JobCompleted as JobCompletedEvent,
  JobCreated as JobCreatedEvent,
  JobDetailsUpdated as JobDetailsUpdatedEvent,
  JobExpireDeadlineIncreased as JobExpireDeadlineIncreasedEvent,
  JobStarted as JobStartedEvent,
  WorkSubmitted as WorkSubmittedEvent
} from "../generated/JobContract/JobContract"
import {
  BidAccepted,
  BidRejected,
  BidSubmitted,
  ClaimAfterExpiredDeadlineSuccessful,
  DisputeRaised,
  DisputeResolved,
  FundLocked,
  FundReleased,
  JobCancelled,
  JobCompleted,
  JobCreated,
  JobDetailsUpdated,
  JobExpireDeadlineIncreased,
  JobStarted,
  WorkSubmitted
} from "../generated/schema"

export function handleBidAccepted(event: BidAcceptedEvent): void {
  let entity = new BidAccepted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer
  entity.amount = event.params.amount
  entity.bidIndex = event.params.bidIndex

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBidRejected(event: BidRejectedEvent): void {
  let entity = new BidRejected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer
  entity.amount = event.params.amount
  entity.bidIndex = event.params.bidIndex

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let entity = new BidSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer
  entity.amount = event.params.amount
  entity.bidIndex = event.params.bidIndex
  entity.proposalIpfs = event.params.proposalIpfs

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleClaimAfterExpiredDeadlineSuccessful(
  event: ClaimAfterExpiredDeadlineSuccessfulEvent
): void {
  let entity = new ClaimAfterExpiredDeadlineSuccessful(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeRaised(event: DisputeRaisedEvent): void {
  let entity = new DisputeRaised(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.by = event.params.by

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolved(event: DisputeResolvedEvent): void {
  let entity = new DisputeResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.winner = event.params.winner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFundLocked(event: FundLockedEvent): void {
  let entity = new FundLocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.amount = event.params.amount
  entity.client = event.params.client
  entity.freelancer = event.params.freelancer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFundReleased(event: FundReleasedEvent): void {
  let entity = new FundReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.amount = event.params.amount
  entity.to = event.params.to

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobCancelled(event: JobCancelledEvent): void {
  let entity = new JobCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.client = event.params.client

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobCompleted(event: JobCompletedEvent): void {
  let entity = new JobCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobCreated(event: JobCreatedEvent): void {
  let entity = new JobCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.client = event.params.client
  entity.budget = event.params.budget
  entity.bidDeadline = event.params.bidDeadline
  entity.expireDeadline = event.params.expireDeadline
  entity.ipfs = event.params.ipfs

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobDetailsUpdated(event: JobDetailsUpdatedEvent): void {
  let entity = new JobDetailsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.client = event.params.client
  entity.budget = event.params.budget
  entity.bidDeadline = event.params.bidDeadline
  entity.expireDeadline = event.params.expireDeadline
  entity.ipfs = event.params.ipfs

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobExpireDeadlineIncreased(
  event: JobExpireDeadlineIncreasedEvent
): void {
  let entity = new JobExpireDeadlineIncreased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.exceedTimeBy = event.params.exceedTimeBy

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleJobStarted(event: JobStartedEvent): void {
  let entity = new JobStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWorkSubmitted(event: WorkSubmittedEvent): void {
  let entity = new WorkSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.jobId = event.params.jobId
  entity.freelancer = event.params.freelancer
  entity.ipfsProof = event.params.ipfsProof

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
