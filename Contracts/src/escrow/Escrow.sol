// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    IERC20
} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICouncilRegistry} from "../dao/interfaces/ICouncilRegistry.sol";

contract Escrow {
    using SafeERC20 for IERC20;

    error cannotLockedTwice();
    error InvalidState();
    error OnlyTimelock();
    error InvalidFeeBps();
    error InvalidCouncilRegistry();

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
    event CouncilRegistryUpdated(
        address indexed oldCouncilRegistry,
        address indexed newCouncilRegistry
    );
    event CouncilPoolFeeUpdated(
        uint256 oldClientCouncilFeeBps,
        uint256 newClientCouncilFeeBps,
        uint256 oldFreelancerCouncilFeeBps,
        uint256 newFreelancerCouncilFeeBps
    );
    event CouncilPoolFunded(bytes32 indexed jobId, uint256 amount);

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
    ICouncilRegistry public councilRegistry;

    uint256 public clientFeeBps;
    uint256 public protocolFeeBps;
    uint256 public clientCouncilFeeBps;
    uint256 public freelancerCouncilFeeBps;

    constructor(
        address _usdc,
        address _treasury,
        address _timelock,
        address _councilRegistry
    ) {
        if (_councilRegistry == address(0)) revert InvalidCouncilRegistry();
        USDC = IERC20(_usdc);
        treasury = _treasury;
        timelock = _timelock;
        councilRegistry = ICouncilRegistry(_councilRegistry);
        clientFeeBps = 400;
        protocolFeeBps = 800;
        clientCouncilFeeBps = 100;
        freelancerCouncilFeeBps = 100;
        _validateFeeConfig(clientFeeBps, protocolFeeBps, freelancerCouncilFeeBps);

        emit TreasuryUpdated(address(0), _treasury);
        emit TimelockUpdated(address(0), _timelock);
        emit FeeUpdated(0, clientFeeBps, 0, protocolFeeBps);
        emit CouncilRegistryUpdated(address(0), _councilRegistry);
        emit CouncilPoolFeeUpdated(
            0,
            clientCouncilFeeBps,
            0,
            freelancerCouncilFeeBps
        );
    }

    modifier onlyTimelock() virtual {
        if (msg.sender != timelock) revert OnlyTimelock();
        _;
    }

    function setTimelock(address _timelock) external virtual onlyTimelock {
        require(_timelock != address(0), "Invalid timelock address");
        address oldTimelock = timelock;
        timelock = _timelock;
        emit TimelockUpdated(oldTimelock, _timelock);
    }

    function setTreasury(address _treasury) external onlyTimelock {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    function setCouncilRegistry(address _councilRegistry) external onlyTimelock {
        if (_councilRegistry == address(0)) revert InvalidCouncilRegistry();
        address oldCouncilRegistry = address(councilRegistry);
        councilRegistry = ICouncilRegistry(_councilRegistry);
        emit CouncilRegistryUpdated(oldCouncilRegistry, _councilRegistry);
    }

    function setFee(
        uint256 _clientFeeBps,
        uint256 _protocolFeeBps
    ) external onlyTimelock {
        _validateFeeConfig(
            _clientFeeBps,
            _protocolFeeBps,
            freelancerCouncilFeeBps
        );
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

    function setCouncilPoolFee(
        uint256 _clientCouncilFeeBps,
        uint256 _freelancerCouncilFeeBps
    ) external onlyTimelock {
        _validateFeeConfig(
            clientFeeBps,
            protocolFeeBps,
            _freelancerCouncilFeeBps
        );
        if (_clientCouncilFeeBps > 10000) revert InvalidFeeBps();

        uint256 oldClientCouncilFeeBps = clientCouncilFeeBps;
        uint256 oldFreelancerCouncilFeeBps = freelancerCouncilFeeBps;

        clientCouncilFeeBps = _clientCouncilFeeBps;
        freelancerCouncilFeeBps = _freelancerCouncilFeeBps;

        emit CouncilPoolFeeUpdated(
            oldClientCouncilFeeBps,
            _clientCouncilFeeBps,
            oldFreelancerCouncilFeeBps,
            _freelancerCouncilFeeBps
        );
    }

    function _lockFunds(
        bytes32 jobId,
        uint256 bidAmount,
        address freelancer
    ) internal {
        if (escrows[jobId].funded) revert cannotLockedTwice();

        uint256 clientFee = (bidAmount * clientFeeBps) / 10000;
        uint256 clientCouncilContribution = (bidAmount * clientCouncilFeeBps) /
            10000;
        uint256 totalDeposit = bidAmount + clientFee + clientCouncilContribution;

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
        uint256 freelancerCouncilContribution = (e.bidAmount *
            freelancerCouncilFeeBps) / 10000;
        uint256 freelancerAmount =
            e.bidAmount -
            protocolFee -
            freelancerCouncilContribution;
        uint256 clientFee = e.amountLocked - e.bidAmount;
        uint256 clientCouncilContribution = (e.bidAmount * clientCouncilFeeBps) /
            10000;
        uint256 treasuryAmount = protocolFee + clientFee - clientCouncilContribution;
        uint256 councilPoolAmount =
            clientCouncilContribution +
            freelancerCouncilContribution;

        // Send funds
        USDC.safeTransfer(e.freelancer, freelancerAmount);
        USDC.safeTransfer(treasury, treasuryAmount);
        USDC.safeTransfer(address(councilRegistry), councilPoolAmount);
        councilRegistry.notifyPoolContribution(councilPoolAmount);

        e.released = true;

        emit FundReleased(jobId, freelancerAmount, treasuryAmount);
        emit CouncilPoolFunded(jobId, councilPoolAmount);
    }

    function _refundClient(bytes32 jobId) internal {
        EscrowInfo storage e = escrows[jobId];
        if (!e.funded || e.released) revert InvalidState();

        // Refund complete deposit
        USDC.safeTransfer(e.client, e.amountLocked);

        e.released = true;

        emit FundRefunded(jobId, e.amountLocked, e.client);
    }

    function _validateFeeConfig(
        uint256 _clientFeeBps,
        uint256 _protocolFeeBps,
        uint256 _freelancerCouncilFeeBps
    ) internal pure {
        if (
            _clientFeeBps > 10000 ||
            _protocolFeeBps > 10000 ||
            _freelancerCouncilFeeBps > 10000 ||
            _protocolFeeBps + _freelancerCouncilFeeBps > 10000
        ) {
            revert InvalidFeeBps();
        }
    }
}
