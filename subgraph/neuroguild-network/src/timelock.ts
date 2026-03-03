import {
  CallExecuted as CallExecutedEvent,
  CallSalt as CallSaltEvent,
  CallScheduled as CallScheduledEvent,
  Cancelled as CancelledEvent,
  MinDelayChange as MinDelayChangeEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
} from "../generated/Timelock/Timelock";
import {
  CallExecutedHistory,
  CallScheduledHistory,
  ProtocolConfig,
  RoleGrantedHistory,
  RoleRevokedHistory,
  TimelockCancelledHistory,
  TimelockOperation,
  TimelockRole,
  TimelockRoleConfig,
} from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

function opId(bytesId: Bytes): string {
  return bytesId.toHex();
}

function getConfig(ts: BigInt): ProtocolConfig {
  let cfg = ProtocolConfig.load("global");
  if (cfg == null) {
    cfg = new ProtocolConfig("global");
    cfg.createdAt = ts;
  }
  return cfg;
}

function getOperation(id: string, opBytes: Bytes, ts: BigInt): TimelockOperation {
  let op = TimelockOperation.load(id);
  if (op == null) {
    op = new TimelockOperation(id);
    op.operationId = opBytes;
    op.index = null;
    op.target = null;
    op.value = null;
    op.data = null;
    op.predecessor = null;
    op.salt = null;
    op.delay = null;
    op.status = "SCHEDULED";
    op.createdAt = ts;
  }
  return op;
}

export function handleCallScheduled(event: CallScheduledEvent): void {
  let id = opId(event.params.id);
  let op = getOperation(id, event.params.id, event.block.timestamp);
  op.index = event.params.index;
  op.target = event.params.target;
  op.value = event.params.value;
  op.data = event.params.data;
  op.predecessor = event.params.predecessor;
  op.delay = event.params.delay;
  op.status = "SCHEDULED";
  op.updatedAt = event.block.timestamp;
  op.save();

  let h = new CallScheduledHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.operationId = event.params.id;
  h.index = event.params.index;
  h.target = event.params.target;
  h.value = event.params.value;
  h.data = event.params.data;
  h.predecessor = event.params.predecessor;
  h.delay = event.params.delay;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleCallExecuted(event: CallExecutedEvent): void {
  let id = opId(event.params.id);
  let op = getOperation(id, event.params.id, event.block.timestamp);
  op.index = event.params.index;
  op.target = event.params.target;
  op.value = event.params.value;
  op.data = event.params.data;
  op.status = "EXECUTED";
  op.updatedAt = event.block.timestamp;
  op.save();

  let h = new CallExecutedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.operationId = event.params.id;
  h.index = event.params.index;
  h.target = event.params.target;
  h.value = event.params.value;
  h.data = event.params.data;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleCallSalt(event: CallSaltEvent): void {
  let id = opId(event.params.id);
  let op = getOperation(id, event.params.id, event.block.timestamp);
  op.salt = event.params.salt;
  op.updatedAt = event.block.timestamp;
  op.save();
}

export function handleCancelled(event: CancelledEvent): void {
  let id = opId(event.params.id);
  let op = getOperation(id, event.params.id, event.block.timestamp);
  op.status = "CANCELLED";
  op.updatedAt = event.block.timestamp;
  op.save();

  let h = new TimelockCancelledHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.operationId = event.params.id;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleMinDelayChange(event: MinDelayChangeEvent): void {
  let cfg = getConfig(event.block.timestamp);
  cfg.minDelay = event.params.newDuration;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let id = event.params.role.toHex();
  let cfg = TimelockRoleConfig.load(id);
  if (cfg == null) {
    cfg = new TimelockRoleConfig(id);
    cfg.role = event.params.role;
    cfg.createdAt = event.block.timestamp;
  }
  cfg.adminRole = event.params.newAdminRole;
  cfg.updatedAt = event.block.timestamp;
  cfg.save();
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let id = event.params.role.toHex() + "-" + event.params.account.toHex();
  let role = TimelockRole.load(id);
  if (role == null) {
    role = new TimelockRole(id);
    role.role = event.params.role;
    role.account = event.params.account;
    role.createdAt = event.block.timestamp;
  }
  role.sender = event.params.sender;
  role.isActive = true;
  role.updatedAt = event.block.timestamp;
  role.save();

  let h = new RoleGrantedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.role = event.params.role;
  h.account = event.params.account;
  h.sender = event.params.sender;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let id = event.params.role.toHex() + "-" + event.params.account.toHex();
  let role = TimelockRole.load(id);
  if (role == null) {
    role = new TimelockRole(id);
    role.role = event.params.role;
    role.account = event.params.account;
    role.createdAt = event.block.timestamp;
  }
  role.sender = event.params.sender;
  role.isActive = false;
  role.updatedAt = event.block.timestamp;
  role.save();

  let h = new RoleRevokedHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.role = event.params.role;
  h.account = event.params.account;
  h.sender = event.params.sender;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}
