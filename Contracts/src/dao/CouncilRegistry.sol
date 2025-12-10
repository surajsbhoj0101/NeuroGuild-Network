// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CouncilRegistry {
    address public timelock;

    mapping(address => bool) public isCouncil;
    address[] public councilMembers;

    error OnlyTimelock();
    error AlreadyCouncil();
    error NotCouncil();

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    constructor(address _timelock) {
        timelock = _timelock;
    }

    function setTimelock(address _timelock) external onlyTimelock {
        require(_timelock != address(0), "Invalid timelock");
        timelock = _timelock;
    }

    function addCouncil(address member) external onlyTimelock {
        if (isCouncil[member]) revert AlreadyCouncil();
        isCouncil[member] = true;
        councilMembers.push(member);
        
    }

    function removeCouncil(address member) external onlyTimelock {
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
