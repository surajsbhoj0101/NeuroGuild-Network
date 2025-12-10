// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    IERC20
} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow {
    using SafeERC20 for IERC20;

    error cannotLockedTwice();
    error InvalidState();
    error OnlyTimelock();

    event FundLocked(
        bytes32 indexed jobId,
        uint256 amountLocked,
        uint256 bidAmount,
        address indexed client,
        address indexed freelancer
    );
    event FundReleased(
        bytes32 indexed jobId,
        uint256 amountToFreelancer,
        uint256 feeToTreasury
    );
    event FundRefunded(
        bytes32 indexed jobId,
        uint256 amountRefunded,
        address indexed client
    );

    struct EscrowInfo {
        address client;
        address freelancer;
        uint256 bidAmount; // real job price
        uint256 amountLocked; // bid + 4%
        bool funded;
        bool released;
    }

    mapping(bytes32 => EscrowInfo) public escrows;

    IERC20 public immutable USDC;
    address public treasury;
    address public timelock;

    uint256 public clientFeeBps;
    uint256 public protocolFeeBps;

    constructor(address _usdc, address _treasury, address _timelock) {
        USDC = IERC20(_usdc);
        treasury = _treasury;
        timelock = _timelock;
        clientFeeBps = 400;
        protocolFeeBps = 800;
    }

    modifier onlyTimelock() virtual {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    function setTimelock(address _timelock) external virtual onlyTimelock {
        timelock = _timelock;
    }

    function setTreasury(address _treasury) external onlyTimelock {
        treasury = _treasury;
    }

    function setFee(
        uint256 _clientFeeBps,
        uint256 _protocolFeeBps
    ) external onlyTimelock {
        clientFeeBps = _clientFeeBps;
        protocolFeeBps = _protocolFeeBps;
    }

    function _lockFunds(
        bytes32 jobId,
        uint256 bidAmount,
        address freelancer
    ) internal {
        if (escrows[jobId].funded) revert cannotLockedTwice();

        uint256 clientFee = (bidAmount * clientFeeBps) / 10000;
        uint256 totalDeposit = bidAmount + clientFee;

        // Transfer from client
        USDC.safeTransferFrom(msg.sender, address(this), totalDeposit);

        escrows[jobId] = EscrowInfo({
            client: msg.sender,
            freelancer: freelancer,
            bidAmount: bidAmount,
            amountLocked: totalDeposit,
            funded: true,
            released: false
        });

        emit FundLocked(jobId, totalDeposit, bidAmount, msg.sender, freelancer);
    }

    function _releaseFunds(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();

        uint256 protocolFee = (e.bidAmount * protocolFeeBps) / 10000; // 8%
        uint256 freelancerAmount = e.bidAmount - protocolFee; // 92%

        // Send funds
        USDC.safeTransfer(e.freelancer, freelancerAmount);
        USDC.safeTransfer(treasury, protocolFee);

        e.released = true;

        emit FundReleased(jobId, freelancerAmount, protocolFee);
    }

    function _refundClient(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();

        // Refund complete deposit
        USDC.safeTransfer(e.client, e.amountLocked);

        e.released = true;

        emit FundRefunded(jobId, e.amountLocked, e.client);
    }
}
