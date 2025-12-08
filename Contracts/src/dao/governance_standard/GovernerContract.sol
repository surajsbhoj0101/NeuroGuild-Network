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
    struct Dispute {
        bytes32 jobId;
        address raisedBy;
        string reason;
        address client;
        address freelancer;
        bool resolved;
    }

    address public admin; // temporary 
    IReputationSBT reputation;
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _admin
    )
        Governor("NeuroGuildGovernor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function renounceAdmin() external onlyAdmin {
        admin = address(0);
    }

    function votingDelay() public pure override returns (uint256) {
        return 7200; // approx 1 day
    }

    function votingPeriod() public pure override returns (uint256) {
        return 50400; // approx 1 week
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    function getVotes(
        address voter,
        uint256 blockNumber
    ) public view override returns (uint256) {
        uint256 tokenVotes = super.getVotes(voter, blockNumber);

       
        uint256 tokenId = reputation.userToToken(voter);
        uint256 repVotes = 0;

        if (tokenId != 0) {
            (, , , , , uint256 totalScore, , , ) = reputation.repData(tokenId);
            repVotes = totalScore;
        }

        return tokenVotes + (repVotes / 4);
    }



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

    function proposalNeedsQueuing(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
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

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
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
