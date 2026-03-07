// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";

contract ExecuteBootstrapScript is Script {
    bytes32 internal constant BOOTSTRAP_SALT =
        keccak256("bootstrap-reputation-job-contract");

    function run() external {
        uint256 executorPrivateKey = vm.envUint("PRIVATE_KEY");
        address timelockAddress = vm.envAddress("TIMELOCK_ADDRESS");
        address reputationAddress = vm.envAddress("REPUTATION_SBT_ADDRESS");
        address jobContractAddress = vm.envAddress("JOB_CONTRACT_ADDRESS");

        TimeLock timelock = TimeLock(payable(timelockAddress));

        bytes memory bootstrapReputationCall = abi.encodeCall(
            ReputationSBT.setJobContract,
            (jobContractAddress)
        );

        bytes32 operationId = timelock.hashOperation(
            reputationAddress,
            0,
            bootstrapReputationCall,
            bytes32(0),
            BOOTSTRAP_SALT
        );

        console.log("Executor:", vm.addr(executorPrivateKey));
        console.log("Timelock:", timelockAddress);
        console.log("ReputationSBT:", reputationAddress);
        console.log("JobContract:", jobContractAddress);
        console.logBytes32(operationId);

        require(
            timelock.isOperationReady(operationId),
            "Bootstrap operation is not ready yet"
        );

        vm.startBroadcast(executorPrivateKey);

        timelock.execute(
            reputationAddress,
            0,
            bootstrapReputationCall,
            bytes32(0),
            BOOTSTRAP_SALT
        );

        vm.stopBroadcast();

        console.log("Bootstrap executed successfully");
    }
}
