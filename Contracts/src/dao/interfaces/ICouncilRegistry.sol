// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICouncilRegistry {
    error OnlyGovernance();
    error AlreadyCouncil();
    error NotCouncil();

    function isCouncil(address member) external view returns (bool);
    function getCouncilMembers() external view returns (address[] memory);
    function notifyPoolContribution(uint256 amount) external;
}
