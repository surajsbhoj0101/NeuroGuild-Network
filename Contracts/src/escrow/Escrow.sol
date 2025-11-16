// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow {
    using SafeERC20 for IERC20;
    error cannotLockedTwice();
    error tokenReleaseFailed();
    error tokenLockingToEscrowFailed();
    error cannotReleaseTwice();
    error InvalidState();

    event FundLocked(bytes32 indexed jobId, uint256 amount, address indexed client, address indexed freelancer);
    event FundReleased(bytes32 indexed jobId, uint256 amount, address indexed to);

    struct EscrowInfo {
        address client;
        address freelancer;
        uint256 amount;
        bool funded;
        bool released;
    }

    mapping(bytes32 => EscrowInfo) public escrows;
    IERC20 public immutable USDC;

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
    }

    function _lockFunds(bytes32 jobId, uint256 amount, address freelancer) internal {
        if (escrows[jobId].funded) revert cannotLockedTwice();
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        escrows[jobId] = EscrowInfo(msg.sender, freelancer, amount, true, false);
        emit FundLocked(jobId, amount, msg.sender, freelancer);
    }

    function _releaseFunds(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();
        USDC.safeTransfer(e.freelancer, e.amount);
        e.released = true;
        emit FundReleased(jobId, e.amount, e.freelancer);
    }

    function _refundClient(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();
        USDC.safeTransfer(e.client, e.amount);
        e.released = true;
        emit FundReleased(jobId, e.amount, e.client);
    }
}
