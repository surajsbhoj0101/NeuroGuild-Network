import {
  CouncilPaid as CouncilPaidEvent,
  CouncilRegistryUpdated as CouncilRegistryUpdatedEvent,
  CouncilRewardAdded as CouncilRewardAddedEvent,
  DeveloperPaid as DeveloperPaidEvent,
  DeveloperRewardAdded as DeveloperRewardAddedEvent,
  EmergencyWithdrawn as EmergencyWithdrawnEvent,
  ProtocolFeeReceived as ProtocolFeeReceivedEvent,
  TimelockUpdated as TimelockUpdatedEvent,
} from "../generated/Treasury/Treasury";
import {
  CouncilPaidHistory,
  CouncilRewardAddedHistory,
  DeveloperPaidHistory,
  DeveloperRewardAddedHistory,
  EmergencyWithdrawnHistory,
  ProtocolConfig,
  ProtocolFeeReceivedHistory,
  TreasuryAccount,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

function getTreasuryAccount(id: string, account: Bytes, ts: BigInt): TreasuryAccount {
  let t = TreasuryAccount.load(id);
  if (t == null) {
    t = new TreasuryAccount(id);
    t.account = account;
    t.councilRewardAdded = BigInt.zero();
    t.councilPaid = BigInt.zero();
    t.developerRewardAdded = BigInt.zero();
    t.developerPaid = BigInt.zero();
    t.protocolFeeContributed = BigInt.zero();
    t.emergencyWithdrawn = BigInt.zero();
    t.createdAt = ts;
  }
  return t;
}

export function handleCouncilPaid(event: CouncilPaidEvent): void {
  let acct = getTreasuryAccount(
    event.params.council.toHex(),
    event.params.council,
    event.block.timestamp
  );
  acct.councilPaid = acct.councilPaid.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new CouncilPaidHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.council = event.params.council;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleCouncilRegistryUpdated(
  event: CouncilRegistryUpdatedEvent
): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.councilRegistry = event.params.newRegistry;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleCouncilRewardAdded(event: CouncilRewardAddedEvent): void {
  let acct = getTreasuryAccount(
    event.params.council.toHex(),
    event.params.council,
    event.block.timestamp
  );
  acct.councilRewardAdded = acct.councilRewardAdded.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new CouncilRewardAddedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.council = event.params.council;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleDeveloperPaid(event: DeveloperPaidEvent): void {
  let acct = getTreasuryAccount(event.params.dev.toHex(), event.params.dev, event.block.timestamp);
  acct.developerPaid = acct.developerPaid.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new DeveloperPaidHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.dev = event.params.dev;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleDeveloperRewardAdded(
  event: DeveloperRewardAddedEvent
): void {
  let acct = getTreasuryAccount(event.params.dev.toHex(), event.params.dev, event.block.timestamp);
  acct.developerRewardAdded = acct.developerRewardAdded.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new DeveloperRewardAddedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.dev = event.params.dev;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleEmergencyWithdrawn(event: EmergencyWithdrawnEvent): void {
  let acct = getTreasuryAccount(event.params.to.toHex(), event.params.to, event.block.timestamp);
  acct.emergencyWithdrawn = acct.emergencyWithdrawn.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new EmergencyWithdrawnHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.to = event.params.to;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleProtocolFeeReceived(event: ProtocolFeeReceivedEvent): void {
  let acct = getTreasuryAccount(event.params.from.toHex(), event.params.from, event.block.timestamp);
  acct.protocolFeeContributed = acct.protocolFeeContributed.plus(event.params.amount);
  acct.updatedAt = event.block.timestamp;
  acct.save();

  let h = new ProtocolFeeReceivedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.from = event.params.from;
  h.amount = event.params.amount;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleTimelockUpdated(event: TimelockUpdatedEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.timelock = event.params.newTimelock;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}
