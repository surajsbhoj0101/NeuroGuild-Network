import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
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
} from "../generated/JobContract/JobContract"

export function createBidAcceptedEvent(
  jobId: Bytes,
  freelancer: Address,
  amount: BigInt,
  bidIndex: BigInt
): BidAccepted {
  let bidAcceptedEvent = changetype<BidAccepted>(newMockEvent())

  bidAcceptedEvent.parameters = new Array()

  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidAcceptedEvent.parameters.push(
    new ethereum.EventParam(
      "bidIndex",
      ethereum.Value.fromUnsignedBigInt(bidIndex)
    )
  )

  return bidAcceptedEvent
}

export function createBidRejectedEvent(
  jobId: Bytes,
  freelancer: Address,
  amount: BigInt,
  bidIndex: BigInt
): BidRejected {
  let bidRejectedEvent = changetype<BidRejected>(newMockEvent())

  bidRejectedEvent.parameters = new Array()

  bidRejectedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  bidRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )
  bidRejectedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "bidIndex",
      ethereum.Value.fromUnsignedBigInt(bidIndex)
    )
  )

  return bidRejectedEvent
}

export function createBidSubmittedEvent(
  jobId: Bytes,
  freelancer: Address,
  amount: BigInt,
  bidIndex: BigInt,
  proposalIpfs: string
): BidSubmitted {
  let bidSubmittedEvent = changetype<BidSubmitted>(newMockEvent())

  bidSubmittedEvent.parameters = new Array()

  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "bidIndex",
      ethereum.Value.fromUnsignedBigInt(bidIndex)
    )
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "proposalIpfs",
      ethereum.Value.fromString(proposalIpfs)
    )
  )

  return bidSubmittedEvent
}

export function createClaimAfterExpiredDeadlineSuccessfulEvent(
  jobId: Bytes
): ClaimAfterExpiredDeadlineSuccessful {
  let claimAfterExpiredDeadlineSuccessfulEvent =
    changetype<ClaimAfterExpiredDeadlineSuccessful>(newMockEvent())

  claimAfterExpiredDeadlineSuccessfulEvent.parameters = new Array()

  claimAfterExpiredDeadlineSuccessfulEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )

  return claimAfterExpiredDeadlineSuccessfulEvent
}

export function createDisputeRaisedEvent(
  jobId: Bytes,
  by: Address
): DisputeRaised {
  let disputeRaisedEvent = changetype<DisputeRaised>(newMockEvent())

  disputeRaisedEvent.parameters = new Array()

  disputeRaisedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  disputeRaisedEvent.parameters.push(
    new ethereum.EventParam("by", ethereum.Value.fromAddress(by))
  )

  return disputeRaisedEvent
}

export function createDisputeResolvedEvent(
  jobId: Bytes,
  winner: Address
): DisputeResolved {
  let disputeResolvedEvent = changetype<DisputeResolved>(newMockEvent())

  disputeResolvedEvent.parameters = new Array()

  disputeResolvedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  disputeResolvedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )

  return disputeResolvedEvent
}

export function createFundLockedEvent(
  jobId: Bytes,
  amount: BigInt,
  client: Address,
  freelancer: Address
): FundLocked {
  let fundLockedEvent = changetype<FundLocked>(newMockEvent())

  fundLockedEvent.parameters = new Array()

  fundLockedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  fundLockedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  fundLockedEvent.parameters.push(
    new ethereum.EventParam("client", ethereum.Value.fromAddress(client))
  )
  fundLockedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )

  return fundLockedEvent
}

export function createFundReleasedEvent(
  jobId: Bytes,
  amount: BigInt,
  to: Address
): FundReleased {
  let fundReleasedEvent = changetype<FundReleased>(newMockEvent())

  fundReleasedEvent.parameters = new Array()

  fundReleasedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  fundReleasedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  fundReleasedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return fundReleasedEvent
}

export function createJobCancelledEvent(
  jobId: Bytes,
  client: Address
): JobCancelled {
  let jobCancelledEvent = changetype<JobCancelled>(newMockEvent())

  jobCancelledEvent.parameters = new Array()

  jobCancelledEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobCancelledEvent.parameters.push(
    new ethereum.EventParam("client", ethereum.Value.fromAddress(client))
  )

  return jobCancelledEvent
}

export function createJobCompletedEvent(
  jobId: Bytes,
  freelancer: Address
): JobCompleted {
  let jobCompletedEvent = changetype<JobCompleted>(newMockEvent())

  jobCompletedEvent.parameters = new Array()

  jobCompletedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )

  return jobCompletedEvent
}

export function createJobCreatedEvent(
  jobId: Bytes,
  client: Address,
  budget: BigInt,
  bidDeadline: BigInt,
  expireDeadline: BigInt,
  ipfs: string
): JobCreated {
  let jobCreatedEvent = changetype<JobCreated>(newMockEvent())

  jobCreatedEvent.parameters = new Array()

  jobCreatedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobCreatedEvent.parameters.push(
    new ethereum.EventParam("client", ethereum.Value.fromAddress(client))
  )
  jobCreatedEvent.parameters.push(
    new ethereum.EventParam("budget", ethereum.Value.fromUnsignedBigInt(budget))
  )
  jobCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "bidDeadline",
      ethereum.Value.fromUnsignedBigInt(bidDeadline)
    )
  )
  jobCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "expireDeadline",
      ethereum.Value.fromUnsignedBigInt(expireDeadline)
    )
  )
  jobCreatedEvent.parameters.push(
    new ethereum.EventParam("ipfs", ethereum.Value.fromString(ipfs))
  )

  return jobCreatedEvent
}

export function createJobDetailsUpdatedEvent(
  jobId: Bytes,
  client: Address,
  budget: BigInt,
  bidDeadline: BigInt,
  expireDeadline: BigInt,
  ipfs: string
): JobDetailsUpdated {
  let jobDetailsUpdatedEvent = changetype<JobDetailsUpdated>(newMockEvent())

  jobDetailsUpdatedEvent.parameters = new Array()

  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam("client", ethereum.Value.fromAddress(client))
  )
  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam("budget", ethereum.Value.fromUnsignedBigInt(budget))
  )
  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "bidDeadline",
      ethereum.Value.fromUnsignedBigInt(bidDeadline)
    )
  )
  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "expireDeadline",
      ethereum.Value.fromUnsignedBigInt(expireDeadline)
    )
  )
  jobDetailsUpdatedEvent.parameters.push(
    new ethereum.EventParam("ipfs", ethereum.Value.fromString(ipfs))
  )

  return jobDetailsUpdatedEvent
}

export function createJobExpireDeadlineIncreasedEvent(
  jobId: Bytes,
  exceedTimeBy: BigInt
): JobExpireDeadlineIncreased {
  let jobExpireDeadlineIncreasedEvent =
    changetype<JobExpireDeadlineIncreased>(newMockEvent())

  jobExpireDeadlineIncreasedEvent.parameters = new Array()

  jobExpireDeadlineIncreasedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobExpireDeadlineIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "exceedTimeBy",
      ethereum.Value.fromUnsignedBigInt(exceedTimeBy)
    )
  )

  return jobExpireDeadlineIncreasedEvent
}

export function createJobStartedEvent(
  jobId: Bytes,
  freelancer: Address
): JobStarted {
  let jobStartedEvent = changetype<JobStarted>(newMockEvent())

  jobStartedEvent.parameters = new Array()

  jobStartedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  jobStartedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )

  return jobStartedEvent
}

export function createWorkSubmittedEvent(
  jobId: Bytes,
  freelancer: Address,
  ipfsProof: string
): WorkSubmitted {
  let workSubmittedEvent = changetype<WorkSubmitted>(newMockEvent())

  workSubmittedEvent.parameters = new Array()

  workSubmittedEvent.parameters.push(
    new ethereum.EventParam("jobId", ethereum.Value.fromFixedBytes(jobId))
  )
  workSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "freelancer",
      ethereum.Value.fromAddress(freelancer)
    )
  )
  workSubmittedEvent.parameters.push(
    new ethereum.EventParam("ipfsProof", ethereum.Value.fromString(ipfsProof))
  )

  return workSubmittedEvent
}
