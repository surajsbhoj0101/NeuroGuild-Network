import {
  Approval as ApprovalEvent,
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
  Transfer as TransferEvent,
} from "../generated/GovernanceToken/GovernanceToken";
import {
  GovernanceApproval,
  GovernanceTransferHistory,
  TokenAccount,
} from "../generated/schema";
import { BigInt, Bytes, dataSource } from "@graphprotocol/graph-ts";

function tokenAddress(): string {
  return dataSource.address().toHex();
}

function accountId(wallet: string): string {
  return tokenAddress() + "-" + wallet;
}

function getAccount(walletHex: string, wallet: Bytes, ts: BigInt): TokenAccount {
  let acct = TokenAccount.load(accountId(walletHex));
  if (acct == null) {
    acct = new TokenAccount(accountId(walletHex));
    acct.token = dataSource.address();
    acct.wallet = wallet;
    acct.balance = BigInt.zero();
    acct.votingPower = BigInt.zero();
    acct.delegate = null;
    acct.createdAt = ts;
  }
  return acct;
}

export function handleApproval(event: ApprovalEvent): void {
  let id = tokenAddress() + "-" + event.params.owner.toHex() + "-" + event.params.spender.toHex();
  let approval = GovernanceApproval.load(id);
  if (approval == null) {
    approval = new GovernanceApproval(id);
    approval.token = dataSource.address();
    approval.owner = event.params.owner;
    approval.spender = event.params.spender;
    approval.createdAt = event.block.timestamp;
  }
  approval.amount = event.params.value;
  approval.updatedAt = event.block.timestamp;
  approval.save();
}

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let acct = getAccount(event.params.delegator.toHex(), event.params.delegator, event.block.timestamp);
  acct.delegate = event.params.toDelegate;
  acct.updatedAt = event.block.timestamp;
  acct.save();
}

export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent
): void {
  let acct = getAccount(event.params.delegate.toHex(), event.params.delegate, event.block.timestamp);
  acct.votingPower = event.params.newVotes;
  acct.updatedAt = event.block.timestamp;
  acct.save();
}

export function handleTransfer(event: TransferEvent): void {
  let from = getAccount(event.params.from.toHex(), event.params.from, event.block.timestamp);
  let to = getAccount(event.params.to.toHex(), event.params.to, event.block.timestamp);

  if (from.balance.ge(event.params.value)) {
    from.balance = from.balance.minus(event.params.value);
  } else {
    from.balance = BigInt.zero();
  }
  to.balance = to.balance.plus(event.params.value);

  from.updatedAt = event.block.timestamp;
  to.updatedAt = event.block.timestamp;
  from.save();
  to.save();

  let h = new GovernanceTransferHistory(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  h.token = dataSource.address();
  h.from = event.params.from;
  h.to = event.params.to;
  h.value = event.params.value;
  h.blockNumber = event.block.number;
  h.transactionHash = event.transaction.hash;
  h.timestamp = event.block.timestamp;
  h.save();
}
