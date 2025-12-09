// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICouncilRegistry {
    error OnlyGovernance();
    error AlreadyCouncil();
    error NotCouncil();

    function isCouncil(address member) external view returns (bool);

    function setGovernor(address _governor) external;

    function addCouncil(address member) external;

    function removeCouncil(address member) external;
    function getCouncilMembers() external view returns (address[] memory);
}
