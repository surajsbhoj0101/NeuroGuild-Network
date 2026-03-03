import {
  CouncilAdded as CouncilAddedEvent,
  CouncilRemoved as CouncilRemovedEvent,
  TimelockUpdated as TimelockUpdatedEvent,
} from "../generated/CouncilRegistry/CouncilRegistry";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ProtocolConfig, User } from "../generated/schema";

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

function getOrCreateUser(walletHex: string, wallet: Bytes, ts: BigInt): User {
  let user = User.load(walletHex);
  if (user == null) {
    user = new User(walletHex);
    user.wallet = wallet;
    user.role = 0;
    user.isBlocked = false;
    user.isCouncil = false;
    user.createdAt = ts;
  }
  return user;
}

export function handleCouncilAdded(event: CouncilAddedEvent): void {
  let id = event.params.member.toHex();
  let user = getOrCreateUser(id, event.params.member, event.block.timestamp);
  user.isCouncil = true;
  user.updatedAt = event.block.timestamp;
  user.save();
}

export function handleCouncilRemoved(event: CouncilRemovedEvent): void {
  let id = event.params.member.toHex();
  let user = getOrCreateUser(id, event.params.member, event.block.timestamp);
  user.isCouncil = false;
  user.updatedAt = event.block.timestamp;
  user.save();
}

export function handleTimelockUpdated(event: TimelockUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.timelock = event.params.newTimelock;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}
