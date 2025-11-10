// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract Escrow {
    error cannotBeLockedTwice();
    error tokenReleaseFailed();
    error tokenLockingToEscrowFailed();

    event FundLocked(
        bytes32 indexed jobId,
        uint256 amount,
        address indexed client,
        address indexed freelancer
    );
    event FundReleased(
        bytes32 indexed jobId,
        uint256 amount,
        address indexed freelancer
    );

    struct EscrowInfo {
        address client;
        address freelancer;
        uint256 amount;
        bool funded;
        bool released;
    }

    mapping(bytes32 => EscrowInfo) public escrows;
    mapping(bytes32 => uint) count;
    mapping(address => uint256) public fundsBy;

    IERC20 usdc;

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function _lockFunds(
        bytes32 jobId,
        uint256 amount,
        address freelancer
    ) internal {
        if (count[jobId] > 0) revert cannotBeLockedTwice();
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert tokenLockingToEscrowFailed();
        }
        escrows[jobId] = EscrowInfo(
            msg.sender,
            freelancer,
            amount,
            true,
            false
        );
        count[jobId] += 1;
        emit FundLocked(jobId, amount, msg.sender, freelancer);
    }

    function _releaseFunds(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        require(e.funded && !e.released, "Invalid state");
        bool success = usdc.transfer(e.freelancer, e.amount);
        if (!success) revert tokenReleaseFailed();

        e.released = true;
        emit FundReleased(jobId, e.amount, e.freelancer);
    }
}
