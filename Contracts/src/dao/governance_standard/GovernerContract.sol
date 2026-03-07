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

interface IGovernorReputation {
    function userToToken(address user) external view returns (uint256);
    function isRevoked(address user) external view returns (bool);
}

contract GoverContract is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    address public admin; // temporary
    event ReputationContractUpdated(address indexed newReputation);
    IGovernorReputation reputation;
    event AdminInitialized(address indexed admin);
    event AdminRenounced(address indexed oldAdmin);
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _reputation
    )
        Governor("NeuroGuildGovernor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {
        admin = msg.sender;
        reputation = IGovernorReputation(_reputation);
        emit ReputationContractUpdated(_reputation);
        emit AdminInitialized(msg.sender);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function setReputation(address _reputation) external onlyAdmin {
        reputation = IGovernorReputation(_reputation);
        emit ReputationContractUpdated(_reputation);
    }

    function renounceAdmin() external onlyAdmin {
        address oldAdmin = admin;
        admin = address(0);
        emit AdminRenounced(oldAdmin);
    }

    function votingDelay() public pure override returns (uint256) {
        return 7200; // approx 1 day
    }

    function votingPeriod() public pure override returns (uint256) {
        return 50400; // approx 1 week
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 1e18;
    }

    function getVotes(
        address voter,
        uint256 blockNumber
    ) public view override returns (uint256) {
        return _getVotes(voter, blockNumber, "");
    }

    function _getVotes(
        address voter,
        uint256 blockNumber,
        bytes memory params
    )
        internal
        view
        override(Governor, GovernorVotes)
        returns (uint256)
    {
        uint256 tokenId = reputation.userToToken(voter);
        if (tokenId == 0 || reputation.isRevoked(voter)) {
            return 0;
        }

        return super._getVotes(voter, blockNumber, params);
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
    ) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

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
