// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ICouncilRegistry} from "./interfaces/ICouncilRegistry.sol";

contract Treasury {
    error OnlyTimelock();

    address public timelock;
    IERC20 public stableToken; 
    ICouncilRegistry public councilRegistry;

    // accounting
    mapping(address => uint256) public pendingCouncilRewards;
    mapping(address => uint256) public pendingDevRewards;

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    constructor(address _timelock, address _stableToken, address _councilRegistry) {
        timelock = _timelock;
        stableToken = IERC20(_stableToken);
        councilRegistry = ICouncilRegistry(_councilRegistry);
    }

    function setTimelock(address _timelock) external onlyTimelock {
        require(_timelock != address(0), "Invalid timelock");
        timelock = _timelock;
    }

    function setCouncilRegistry(address _registry) external onlyTimelock {
        require(_registry != address(0), "Invalid registry");
        councilRegistry = ICouncilRegistry(_registry);
    }

    // stableToken.transferFrom(jobContract, treasury, fee)
    // No function needed — ERC20 transfer is enough.
    // This is intentionally EMPTY.

    function receiveProtocolFee(uint256 /*amount*/) external pure {
        // No logic needed — stableToken already transferred
    }

    function addCouncilReward(address council, uint256 amount)
        external
        onlyTimelock
    {
        require(councilRegistry.isCouncil(council), "Not a council member");
        pendingCouncilRewards[council] += amount;
    }

    function addDeveloperReward(address dev, uint256 amount)
        external
        onlyTimelock
    {
        pendingDevRewards[dev] += amount;
    }

    function payCouncil(address council) external onlyTimelock {
        uint256 amount = pendingCouncilRewards[council];
        pendingCouncilRewards[council] = 0;
        require(amount > 0, "Nothing to pay");

        stableToken.transfer(council, amount);
    }

    function payDeveloper(address dev) external onlyTimelock {
        uint256 amount = pendingDevRewards[dev];
        pendingDevRewards[dev] = 0;
        require(amount > 0, "Nothing to pay");

        stableToken.transfer(dev, amount);
    }

    function emergencyWithdraw(address to, uint256 amount)
        external
        onlyTimelock
    {
        stableToken.transfer(to, amount);
    }
}
