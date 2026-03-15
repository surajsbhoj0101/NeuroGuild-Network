// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract CouncilRegistry {
    using SafeERC20 for IERC20;

    address public timelock;
    IERC20 public rewardToken;

    mapping(address => bool) public isCouncil;
    address[] public councilMembers;
    mapping(address => uint256) public pendingCouncilRewards;

    uint256 public councilPoolBalance;
    uint256 public totalPendingCouncilRewards;
    uint256 public lastDistributionAt;
    uint256 public distributionInterval = 30 days;

    error OnlyTimelock();
    error AlreadyCouncil();
    error NotCouncil();
    error InvalidCouncilAddress();
    error InvalidRewardTokenAddress();
    error InvalidDistributionInterval();
    error InvalidPoolContribution();
    error DistributionTooEarly();
    error NoCouncilMembers();
    error NothingToClaim();
    event TimelockUpdated(address indexed oldTimelock, address indexed newTimelock);
    event RewardTokenUpdated(address indexed oldToken, address indexed newToken);
    event CouncilAdded(address indexed member);
    event CouncilRemoved(address indexed member);
    event CouncilPoolContributionReceived(address indexed from, uint256 amount);
    event CouncilPoolDistributed(
        uint256 totalDistributed,
        uint256 perCouncilAmount,
        uint256 memberCount,
        uint256 nextPoolBalance
    );
    event CouncilRewardClaimed(address indexed member, uint256 amount);
    event DistributionIntervalUpdated(
        uint256 oldInterval,
        uint256 newInterval
    );

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    constructor(address _timelock, address _rewardToken) {
        if (_rewardToken == address(0)) revert InvalidRewardTokenAddress();
        timelock = _timelock;
        rewardToken = IERC20(_rewardToken);
        lastDistributionAt = block.timestamp;
        emit TimelockUpdated(address(0), _timelock);
        emit RewardTokenUpdated(address(0), _rewardToken);
    }

    function setTimelock(address _timelock) external onlyTimelock {
        require(_timelock != address(0), "Invalid timelock");
        address oldTimelock = timelock;
        timelock = _timelock;
        emit TimelockUpdated(oldTimelock, _timelock);
    }

    function setRewardToken(address _rewardToken) external onlyTimelock {
        if (_rewardToken == address(0)) revert InvalidRewardTokenAddress();
        address oldToken = address(rewardToken);
        rewardToken = IERC20(_rewardToken);
        emit RewardTokenUpdated(oldToken, _rewardToken);
    }

    function setDistributionInterval(uint256 _distributionInterval)
        external
        onlyTimelock
    {
        if (_distributionInterval == 0) revert InvalidDistributionInterval();
        uint256 oldInterval = distributionInterval;
        distributionInterval = _distributionInterval;
        emit DistributionIntervalUpdated(oldInterval, _distributionInterval);
    }

    function addCouncil(address member) external onlyTimelock {
        if (member == address(0)) revert InvalidCouncilAddress();
        if (isCouncil[member]) revert AlreadyCouncil();
        isCouncil[member] = true;
        councilMembers.push(member);
        emit CouncilAdded(member);
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
        emit CouncilRemoved(member);
    }

    function getCouncilMembers() external view returns (address[] memory) {
        return councilMembers;
    }

    function notifyPoolContribution(uint256 amount) external {
        if (amount == 0) revert InvalidPoolContribution();

        uint256 trackedBalance = councilPoolBalance + totalPendingCouncilRewards;
        uint256 currentBalance = rewardToken.balanceOf(address(this));
        if (currentBalance < trackedBalance + amount) {
            revert InvalidPoolContribution();
        }

        councilPoolBalance += amount;
        emit CouncilPoolContributionReceived(msg.sender, amount);
    }

    function distributeMonthlyPool() external {
        if (block.timestamp < lastDistributionAt + distributionInterval) {
            revert DistributionTooEarly();
        }

        uint256 memberCount = councilMembers.length;
        if (memberCount == 0) revert NoCouncilMembers();

        uint256 distributable = councilPoolBalance;
        uint256 perCouncilAmount = distributable / memberCount;
        if (perCouncilAmount == 0) revert InvalidPoolContribution();

        uint256 totalDistributed = perCouncilAmount * memberCount;
        councilPoolBalance = distributable - totalDistributed;
        totalPendingCouncilRewards += totalDistributed;
        lastDistributionAt = block.timestamp;

        for (uint256 i = 0; i < memberCount; i++) {
            pendingCouncilRewards[councilMembers[i]] += perCouncilAmount;
        }

        emit CouncilPoolDistributed(
            totalDistributed,
            perCouncilAmount,
            memberCount,
            councilPoolBalance
        );
    }

    function claimCouncilReward() external {
        uint256 amount = pendingCouncilRewards[msg.sender];
        if (amount == 0) revert NothingToClaim();

        pendingCouncilRewards[msg.sender] = 0;
        totalPendingCouncilRewards -= amount;

        rewardToken.safeTransfer(msg.sender, amount);
        emit CouncilRewardClaimed(msg.sender, amount);
    }
}
