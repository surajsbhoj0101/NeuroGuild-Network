// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CouncilRegistry {
    address public governor;

    mapping(address => bool) public isCouncil;
    address[] public councilMembers;

    error OnlyGovernance();
    error AlreadyCouncil();
    error NotCouncil();

    modifier onlyGovernance() {
        if (msg.sender != governor) revert OnlyGovernance();
        _;
    }

    constructor(address _governor) {
        governor = _governor;
    }

    function setGovernor(address _governor) external onlyGovernance {
        require(_governor != address(0), "Invalid governor");
        governor = _governor;
    }

    function addCouncil(address member) external onlyGovernance {
        if (isCouncil[member]) revert AlreadyCouncil();
        isCouncil[member] = true;
        councilMembers.push(member);
        
    }

    function removeCouncil(address member) external onlyGovernance {
        if (!isCouncil[member]) revert NotCouncil();
        isCouncil[member] = false;
        
        // Remove from array to prevent stale references
        for (uint256 i = 0; i < councilMembers.length; i++) {
            if (councilMembers[i] == member) {
                // Swap with last element and pop
                councilMembers[i] = councilMembers[councilMembers.length - 1];
                councilMembers.pop();
                break;
            }
        }
    }

    function getCouncilMembers() external view returns (address[] memory) {
        return councilMembers;
    }
}
