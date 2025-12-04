import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import { BidAccepted } from "../generated/schema"
import { BidAccepted as BidAcceptedEvent } from "../generated/JobContract/JobContract"
import { handleBidAccepted } from "../src/job-contract"
import { createBidAcceptedEvent } from "./job-contract-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let jobId = Bytes.fromI32(1234567890)
    let freelancer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let bidIndex = BigInt.fromI32(234)
    let newBidAcceptedEvent = createBidAcceptedEvent(
      jobId,
      freelancer,
      amount,
      bidIndex
    )
    handleBidAccepted(newBidAcceptedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("BidAccepted created and stored", () => {
    assert.entityCount("BidAccepted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BidAccepted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "jobId",
      "1234567890"
    )
    assert.fieldEquals(
      "BidAccepted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "freelancer",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BidAccepted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "BidAccepted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "bidIndex",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
