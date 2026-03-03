// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICouncilRegistry} from "./interfaces/ICouncilRegistry.sol";

contract Treasury {
    using SafeERC20 for IERC20;

    error OnlyTimelock();
    event TimelockUpdated(address indexed oldTimelock, address indexed newTimelock);
    event CouncilRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
    );
    event ProtocolFeeReceived(address indexed from, uint256 amount);
    event CouncilRewardAdded(address indexed council, uint256 amount);
    event DeveloperRewardAdded(address indexed dev, uint256 amount);
    event CouncilPaid(address indexed council, uint256 amount);
    event DeveloperPaid(address indexed dev, uint256 amount);
    event EmergencyWithdrawn(address indexed to, uint256 amount);

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

        emit TimelockUpdated(address(0), _timelock);
        emit CouncilRegistryUpdated(address(0), _councilRegistry);
    }

    function setTimelock(address _timelock) external onlyTimelock {
        require(_timelock != address(0), "Invalid timelock");
        address oldTimelock = timelock;
        timelock = _timelock;
        emit TimelockUpdated(oldTimelock, _timelock);
    }

    function setCouncilRegistry(address _registry) external onlyTimelock {
        require(_registry != address(0), "Invalid registry");
        address oldRegistry = address(councilRegistry);
        councilRegistry = ICouncilRegistry(_registry);
        emit CouncilRegistryUpdated(oldRegistry, _registry);
    }

    // stableToken.transferFrom(jobContract, treasury, fee)
    // No function needed — ERC20 transfer is enough.
    // This is intentionally EMPTY.

    function receiveProtocolFee(uint256 amount) external {
        // No accounting needed — stableToken is transferred directly.
        emit ProtocolFeeReceived(msg.sender, amount);
    }

    function addCouncilReward(address council, uint256 amount)
        external
        onlyTimelock
    {
        require(councilRegistry.isCouncil(council), "Not a council member");
        pendingCouncilRewards[council] += amount;
        emit CouncilRewardAdded(council, amount);
    }

    function addDeveloperReward(address dev, uint256 amount)
        external
        onlyTimelock
    {
        pendingDevRewards[dev] += amount;
        emit DeveloperRewardAdded(dev, amount);
    }

    function payCouncil(address council) external onlyTimelock {
        uint256 amount = pendingCouncilRewards[council];
        pendingCouncilRewards[council] = 0;
        require(amount > 0, "Nothing to pay");

        stableToken.safeTransfer(council, amount);
        emit CouncilPaid(council, amount);
    }

    function payDeveloper(address dev) external onlyTimelock {
        uint256 amount = pendingDevRewards[dev];
        pendingDevRewards[dev] = 0;
        require(amount > 0, "Nothing to pay");

        stableToken.safeTransfer(dev, amount);
        emit DeveloperPaid(dev, amount);
    }

    function emergencyWithdraw(address to, uint256 amount)
        external
        onlyTimelock
    {
        stableToken.safeTransfer(to, amount);
        emit EmergencyWithdrawn(to, amount);
    }
}
