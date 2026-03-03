import {
  OwnershipTransferred as OwnershipTransferredEvent,
  ValueChanged as ValueChangedEvent,
} from "../generated/Box/Box";
import { BoxState } from "../generated/schema";
import { BigInt, dataSource } from "@graphprotocol/graph-ts";

function getBoxState(ts: BigInt): BoxState {
  let id = dataSource.address().toHex();
  let state = BoxState.load(id);
  if (state == null) {
    state = new BoxState(id);
    state.createdAt = ts;
  }
  return state;
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let state = getBoxState(event.block.timestamp);
  state.owner = event.params.newOwner;
  state.updatedAt = event.block.timestamp;
  state.save();
}

export function handleValueChanged(event: ValueChangedEvent): void {
  let state = getBoxState(event.block.timestamp);
  state.value = event.params.newValue;
  state.updatedAt = event.block.timestamp;
  state.save();
}
