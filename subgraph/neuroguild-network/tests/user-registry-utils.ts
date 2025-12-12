import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  UserBlocked,
  UserRegistered,
  UserUnblocked
} from "../generated/UserRegistry/UserRegistry"

export function createUserBlockedEvent(wallet: Address): UserBlocked {
  let userBlockedEvent = changetype<UserBlocked>(newMockEvent())

  userBlockedEvent.parameters = new Array()

  userBlockedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )

  return userBlockedEvent
}

export function createUserRegisteredEvent(
  wallet: Address,
  role: i32
): UserRegistered {
  let userRegisteredEvent = changetype<UserRegistered>(newMockEvent())

  userRegisteredEvent.parameters = new Array()

  userRegisteredEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  userRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "role",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(role))
    )
  )

  return userRegisteredEvent
}

export function createUserUnblockedEvent(wallet: Address): UserUnblocked {
  let userUnblockedEvent = changetype<UserUnblocked>(newMockEvent())

  userUnblockedEvent.parameters = new Array()

  userUnblockedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )

  return userUnblockedEvent
}
