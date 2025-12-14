import { UserRegistered as UserRegisteredEvent } from "../generated/UserRegistry/UserRegistry";
import { UserBlocked as UserBlockedEvent } from "../generated/UserRegistry/UserRegistry";
import { UserUnblocked as UserUnblockedEvent } from "../generated/UserRegistry/UserRegistry";
import {
  UserBlocked,
  UserRegistered,
  UserUnblocked,
} from "../generated/schema";
import { User } from "../generated/schema";

export function handleUserRegistered(event: UserRegisteredEvent): void {
  let userId = event.params.wallet.toHex();

  let user = new User(userId);
  user.wallet = event.params.wallet;
  user.role = event.params.role;
  user.createdAt = event.block.timestamp;
  user.isBlocked = false;
  user.save();

  let history = new UserRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  history.wallet = event.params.wallet;
  history.role = event.params.role;
  history.blockNumber = event.block.number;
  history.blockTimestamp = event.block.timestamp;
  history.transactionHash = event.transaction.hash;
  history.save();
}

export function handleUserBlocked(event: UserBlockedEvent): void {
  let userId = event.params.wallet.toHex();
  let user = User.load(userId);
  if (!user) return;

  user.isBlocked = true;
  user.save();

  let history = new UserBlocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  history.wallet = event.params.wallet;
  history.blockNumber = event.block.number;
  history.blockTimestamp = event.block.timestamp;
  history.transactionHash = event.transaction.hash;
  history.save();
}

export function handleUserUnblocked(event: UserUnblockedEvent): void {
  let userId = event.params.wallet.toHex();
  let user = User.load(userId);
  if (!user) return;

  user.isBlocked = false;
  user.save();

  let history = new UserUnblocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  history.wallet = event.params.wallet;
  history.blockNumber = event.block.number;
  history.blockTimestamp = event.block.timestamp;
  history.transactionHash = event.transaction.hash;
  history.save();
}
