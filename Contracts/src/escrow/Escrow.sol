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
    error InvalidFeeBps();

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
    event TimelockUpdated(address indexed oldTimelock, address indexed newTimelock);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeUpdated(
        uint256 oldClientFeeBps,
        uint256 newClientFeeBps,
        uint256 oldProtocolFeeBps,
        uint256 newProtocolFeeBps
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

        emit TreasuryUpdated(address(0), _treasury);
        emit TimelockUpdated(address(0), _timelock);
        emit FeeUpdated(0, clientFeeBps, 0, protocolFeeBps);
    }

    modifier onlyTimelock() virtual {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    function setTimelock(address _timelock) external virtual onlyTimelock {
        address oldTimelock = timelock;
        timelock = _timelock;
        emit TimelockUpdated(oldTimelock, _timelock);
    }

    function setTreasury(address _treasury) external onlyTimelock {
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    function setFee(
        uint256 _clientFeeBps,
        uint256 _protocolFeeBps
    ) external onlyTimelock {
        if (_clientFeeBps > 10000 || _protocolFeeBps > 10000) {
            revert InvalidFeeBps();
        }
        uint256 oldClientFeeBps = clientFeeBps;
        uint256 oldProtocolFeeBps = protocolFeeBps;
        clientFeeBps = _clientFeeBps;
        protocolFeeBps = _protocolFeeBps;
        emit FeeUpdated(
            oldClientFeeBps,
            _clientFeeBps,
            oldProtocolFeeBps,
            _protocolFeeBps
        );
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
        uint256 clientFee = e.amountLocked - e.bidAmount;
        uint256 treasuryAmount = protocolFee + clientFee;

        // Send funds
        USDC.safeTransfer(e.freelancer, freelancerAmount);
        USDC.safeTransfer(treasury, treasuryAmount);

        e.released = true;

        emit FundReleased(jobId, freelancerAmount, treasuryAmount);
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
