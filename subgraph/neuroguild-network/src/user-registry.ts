import {
  UserBlocked as UserBlockedEvent,
  UserRegistered as UserRegisteredEvent,
  UserUnblocked as UserUnblockedEvent,
} from "../generated/UserRegistry/UserRegistry"
import { UserBlocked, UserRegistered, UserUnblocked } from "../generated/schema"

export function handleUserBlocked(event: UserBlockedEvent): void {
  let entity = new UserBlocked(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.wallet = event.params.wallet

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUserRegistered(event: UserRegisteredEvent): void {
  let entity = new UserRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.wallet = event.params.wallet
  entity.role = event.params.role

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUserUnblocked(event: UserUnblockedEvent): void {
  let entity = new UserUnblocked(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.wallet = event.params.wallet

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
