import {
  TimelockUpdated as TimelockUpdatedEvent,
  UserBlocked as UserBlockedEvent,
  UserRegistered as UserRegisteredEvent,
  UserUnblocked as UserUnblockedEvent,
} from "../generated/UserRegistry/UserRegistry";
import { BigInt } from "@graphprotocol/graph-ts";
import {
  ProtocolConfig,
  User,
  UserBlockedHistory,
  UserRegisteredHistory,
  UserUnblockedHistory,
} from "../generated/schema";

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

export function handleUserRegistered(event: UserRegisteredEvent): void {
  let userId = event.params.wallet.toHex();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.wallet = event.params.wallet;
    user.createdAt = event.block.timestamp;
    user.isCouncil = false;
  }

  user.role = event.params.role;
  user.isBlocked = false;
  user.updatedAt = event.block.timestamp;
  user.save();

  let history = new UserRegisteredHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  history.wallet = event.params.wallet;
  history.role = event.params.role;
  history.blockNumber = event.block.number;
  history.transactionHash = event.transaction.hash;
  history.timestamp = event.block.timestamp;
  history.save();
}

export function handleUserBlocked(event: UserBlockedEvent): void {
  let userId = event.params.wallet.toHex();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.wallet = event.params.wallet;
    user.role = 0;
    user.isCouncil = false;
    user.createdAt = event.block.timestamp;
  }

  user.isBlocked = true;
  user.updatedAt = event.block.timestamp;
  user.save();

  let history = new UserBlockedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  history.wallet = event.params.wallet;
  history.blockNumber = event.block.number;
  history.transactionHash = event.transaction.hash;
  history.timestamp = event.block.timestamp;
  history.save();
}

export function handleUserUnblocked(event: UserUnblockedEvent): void {
  let userId = event.params.wallet.toHex();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.wallet = event.params.wallet;
    user.role = 0;
    user.isCouncil = false;
    user.createdAt = event.block.timestamp;
  }

  user.isBlocked = false;
  user.updatedAt = event.block.timestamp;
  user.save();

  let history = new UserUnblockedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  history.wallet = event.params.wallet;
  history.blockNumber = event.block.number;
  history.transactionHash = event.transaction.hash;
  history.timestamp = event.block.timestamp;
  history.save();
}

export function handleTimelockUpdated(event: TimelockUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.timelock = event.params.newTimelock;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}
