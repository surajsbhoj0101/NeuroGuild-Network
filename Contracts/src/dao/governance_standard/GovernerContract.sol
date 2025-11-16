// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    Governor
} from "../../../lib/openzeppelin-contracts/contracts/governance/Governor.sol";
import {
    GovernorCountingSimple
} from "../../../lib/openzeppelin-contracts/contracts/governance/extensions/GovernorCountingSimple.sol";
import {
    GovernorVotes
} from "../../../lib/openzeppelin-contracts/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "../../../lib/openzeppelin-contracts/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {
    GovernorTimelockControl
} from "../../../lib/openzeppelin-contracts/contracts/governance/extensions/GovernorTimelockControl.sol";
import {
    TimelockController
} from "../../../lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {
    IVotes
} from "../../../lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol";

import {IReputationSBT} from "../interfaces/IReputation.sol";

contract GoverContract is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    IReputationSBT internal reputation;
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _rep
        //TimelockController timelock = TimelockController(0xABC...); Work like this
    )
        Governor("MyGovernor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {
        reputation = IReputationSBT(_rep);
    }

    /*
        Time between proposal creation and voting start.
        Here: 7,200 blocks ≈ 1 day (assuming ~12s per block).
     */
    function votingDelay() public pure override returns (uint256) {
        return 7200; // 1 day
    }

    /*
        How long voting remains open.
        Here: 50,400 blocks ≈ 1 week
     */
    function votingPeriod() public pure override returns (uint256) {
        return 50400; // 1 week
    }

    /*
        Minimum number of votes required to create a proposal.
        0 means any token holder can propose.
    */
    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    // The functions below are overrides required by Solidity.

    /*
        Returns the current state of a proposal.
        States: Pending, Active, Defeated, Succeeded, Queued, Executed, Canceled.
     */
    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /*    
        Checks if a proposal must go through Timelock before execution.
        Needed because you’re combining Governor with Timelock.
    */
    function proposalNeedsQueuing(
        uint256 proposalId
    )
        public
        view
        virtual
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function getVotes(
        address voter,
        uint256 blockNumber
    ) public view override returns (uint256) {
        uint256 tokenVotes = super.getVotes(voter, blockNumber);

        // SBT reputation votes
        uint256 tokenId = reputation.getTokenId(voter);
        uint256 repVotes = reputation.getScore(tokenId);

        return tokenVotes + repVotes;
    }

    /*
        Internal function that queues proposal actions in Timelock after voting succeeds.
        Returns the ETA (execution timestamp) from Timelock.
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return
            super._queueOperations(
                proposalId,
                targets,
                values,
                calldatas,
                descriptionHash
            );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    /*
        Cancels a proposal before execution.
        Needed if proposer loses enough voting power, or some condition invalidates the proposal.
     */

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
