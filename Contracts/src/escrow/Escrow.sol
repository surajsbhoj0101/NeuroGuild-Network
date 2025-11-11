// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract Escrow {
    error cannotLockedTwice();
    error tokenReleaseFailed();
    error tokenLockingToEscrowFailed();
    error cannotReleaseTwice();
    error InvalidState();

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

    IERC20 public immutable USDC;

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
    }

    function _lockFunds(
        bytes32 jobId,
        uint256 amount,
        address freelancer
    ) internal {
        if (escrows[jobId].funded) revert cannotLockedTwice();
        bool success = USDC.transferFrom(msg.sender, address(this), amount);
        escrows[jobId] = EscrowInfo(
            msg.sender,
            freelancer,
            amount,
            true,
            false
        );
        if (!success) {
            revert tokenLockingToEscrowFailed();
        }

        emit FundLocked(jobId, amount, msg.sender, freelancer);
    }

    function _releaseFunds(bytes32 jobId) internal {
        if (escrows[jobId].released) revert cannotReleaseTwice();
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();
        bool success = USDC.transfer(e.freelancer, e.amount);
        e.released = true;
        if (!success) revert tokenReleaseFailed();

        emit FundReleased(jobId, e.amount, e.freelancer);
    }

    function _refundClient(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();
        e.released = true;
        USDC.transfer(e.client, e.amount);

        emit FundReleased(jobId, e.amount, e.client);
    }
}
