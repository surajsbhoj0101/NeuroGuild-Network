// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
    uint256 private value;
    event newValueChanged(uint256 newValue);
    constructor() Ownable(msg.sender) {}

    function store(uint256 newValue) public onlyOwner {
        value = newValue;
        emit newValueChanged(value);
    }

    function retrieve() public view returns (uint256) {
        return value;
    }
}
