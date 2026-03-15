// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {JobContract} from "../src/jobs/JobContract.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import {CouncilRegistry} from "../src/dao/CouncilRegistry.sol";
import {Treasury} from "../src/dao/Treasury.sol";
import {SkillSBT} from "../src/sbt/SkillSBT.sol";
import {UserRegistry} from "../src/user/UserRegistry.sol";

contract ExecuteScript is Script {
    error UnsupportedAction(string action);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address timelockAddress = vm.envAddress("TIMELOCK_ADDRESS");
        string memory action = vm.envOr(
            "ACTION",
            string("SET_REPUTATION_JOB_CONTRACT")
        );
        string memory saltLabel = vm.envOr(
            "OPERATION_SALT",
            string("bootstrap-reputation-job-contract")
        );

        TimeLock timelock = TimeLock(payable(timelockAddress));
        (address target, bytes memory data) = _buildCall(action);
        bytes32 salt = keccak256(bytes(saltLabel));
        bytes32 operationId = timelock.hashOperation(
            target,
            0,
            data,
            bytes32(0),
            salt
        );

        require(
            timelock.isOperationReady(operationId),
            "Timelock operation is not ready"
        );

        vm.startBroadcast(deployerPrivateKey);

        timelock.execute(
            target,
            0,
            data,
            bytes32(0),
            salt
        );

        vm.stopBroadcast();
    }

    function _buildCall(
        string memory action
    ) internal view returns (address target, bytes memory data) {
        bytes32 actionHash = keccak256(bytes(action));

        if (actionHash == keccak256("SET_REPUTATION_JOB_CONTRACT")) {
            address reputationSbtAddress = vm.envAddress("REPUTATIONSBT_ADDRESS");
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            return (
                reputationSbtAddress,
                abi.encodeCall(ReputationSBT.setJobContract, (jobContractAddress))
            );
        }

        if (actionHash == keccak256("SET_REPUTATION_TIMELOCK")) {
            address reputationSbtAddress = vm.envAddress("REPUTATIONSBT_ADDRESS");
            address newTimelock = vm.envAddress("NEW_TIMELOCK_ADDRESS");
            return (
                reputationSbtAddress,
                abi.encodeCall(ReputationSBT.setTimelock, (newTimelock))
            );
        }

        if (actionHash == keccak256("SET_JOB_REPUTATION_ADDRESS")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            address reputationSbtAddress = vm.envAddress("REPUTATIONSBT_ADDRESS");
            return (
                jobContractAddress,
                abi.encodeCall(
                    JobContract.setReputationAddress,
                    (reputationSbtAddress)
                )
            );
        }

        if (actionHash == keccak256("SET_JOB_TIMELOCK")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            address newTimelock = vm.envAddress("NEW_TIMELOCK_ADDRESS");
            return (
                jobContractAddress,
                abi.encodeCall(JobContract.setTimelock, (newTimelock))
            );
        }

        if (actionHash == keccak256("SET_JOB_TREASURY")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
            return (
                jobContractAddress,
                abi.encodeCall(Escrow.setTreasury, (treasuryAddress))
            );
        }

        if (actionHash == keccak256("SET_JOB_COUNCIL_REGISTRY")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            address councilRegistryAddress = vm.envAddress(
                "COUNCILREGISTRY_ADDRESS"
            );
            return (
                jobContractAddress,
                abi.encodeCall(Escrow.setCouncilRegistry, (councilRegistryAddress))
            );
        }

        if (actionHash == keccak256("SET_JOB_DISPUTE_RERAISE_COOLDOWN")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            uint256 cooldown = vm.envUint("DISPUTE_RERAISE_COOLDOWN");
            return (
                jobContractAddress,
                abi.encodeCall(
                    JobContract.setDisputeReraiseCooldown,
                    (cooldown)
                )
            );
        }

        if (actionHash == keccak256("SET_JOB_DEFAULT_REP_METADATA_URI")) {
            address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
            string memory metadataURI = vm.envString(
                "DEFAULT_REPUTATION_METADATA_URI"
            );
            return (
                jobContractAddress,
                abi.encodeCall(
                    JobContract.setDefaultReputationMetadataURI,
                    (metadataURI)
                )
            );
        }

        if (actionHash == keccak256("SET_COUNCIL_TIMELOCK")) {
            address councilRegistryAddress = vm.envAddress(
                "COUNCILREGISTRY_ADDRESS"
            );
            address newTimelock = vm.envAddress("NEW_TIMELOCK_ADDRESS");
            return (
                councilRegistryAddress,
                abi.encodeCall(CouncilRegistry.setTimelock, (newTimelock))
            );
        }

        if (actionHash == keccak256("SET_COUNCIL_REWARD_TOKEN")) {
            address councilRegistryAddress = vm.envAddress(
                "COUNCILREGISTRY_ADDRESS"
            );
            address rewardTokenAddress = vm.envAddress("REWARD_TOKEN_ADDRESS");
            return (
                councilRegistryAddress,
                abi.encodeCall(
                    CouncilRegistry.setRewardToken,
                    (rewardTokenAddress)
                )
            );
        }

        if (actionHash == keccak256("SET_TREASURY_TIMELOCK")) {
            address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
            address newTimelock = vm.envAddress("NEW_TIMELOCK_ADDRESS");
            return (
                treasuryAddress,
                abi.encodeCall(Treasury.setTimelock, (newTimelock))
            );
        }

        if (actionHash == keccak256("SET_TREASURY_COUNCIL_REGISTRY")) {
            address treasuryAddress = vm.envAddress("TREASURY_ADDRESS");
            address councilRegistryAddress = vm.envAddress(
                "COUNCILREGISTRY_ADDRESS"
            );
            return (
                treasuryAddress,
                abi.encodeCall(
                    Treasury.setCouncilRegistry,
                    (councilRegistryAddress)
                )
            );
        }

        if (actionHash == keccak256("SET_SKILL_COUNCIL_REGISTRY")) {
            address skillSbtAddress = vm.envAddress("SKILLSBT_ADDRESS");
            address councilRegistryAddress = vm.envAddress(
                "COUNCILREGISTRY_ADDRESS"
            );
            return (
                skillSbtAddress,
                abi.encodeCall(
                    SkillSBT.updateCouncilRegistry,
                    (councilRegistryAddress)
                )
            );
        }

        if (actionHash == keccak256("SET_USERREGISTRY_TIMELOCK")) {
            address userRegistryAddress = vm.envAddress("USERREGISTRY_ADDRESS");
            address newTimelock = vm.envAddress("NEW_TIMELOCK_ADDRESS");
            return (
                userRegistryAddress,
                abi.encodeCall(UserRegistry.setTimelock, (newTimelock))
            );
        }

        revert UnsupportedAction(action);
    }
}
