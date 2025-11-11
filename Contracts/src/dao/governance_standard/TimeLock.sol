// We want to wait for a new vote to be "executed".
// EveryOne who has the governance token has to 5 tokens.
// Give time to users to get out if the don't like the governance.

/*
In on-chain governance (like DAO governance), when a proposal is passed (approved by token holders’ votes), it doesn’t execute immediately. Instead, it usually passes through a Timelock contract.
 */

/*
Proposal created → DAO members vote.

Proposal succeeds → goes into Timelock (queued).

Waiting period (e.g., 2 days, 1 week).

Execution → only after Timelock expires.
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../../lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    constructor(uint256 minDelay, address[] memory porposers , address[] memory executors, address admin) TimelockController(minDelay, porposers, executors, admin) {
        
    }
}


