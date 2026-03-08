// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";

contract ExecuteScript is Script {
    bytes32 internal constant BOOTSTRAP_SALT =
        keccak256("bootstrap-reputation-job-contract");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address timelockAddress = vm.envAddress("TIMELOCK_ADDRESS");
        address jobContractAddress = vm.envAddress("JOBCONTRACT_ADDRESS");
        address reputationSbtAddress = vm.envAddress("REPUTATIONSBT_ADDRESS");

        TimeLock timelock = TimeLock(payable(timelockAddress));
        bytes memory bootstrapReputationCall = abi.encodeCall(
            ReputationSBT.setJobContract,
            (jobContractAddress)
        );
        bytes32 operationId = timelock.hashOperation(
            reputationSbtAddress,
            0,
            bootstrapReputationCall,
            bytes32(0),
            BOOTSTRAP_SALT
        );

        require(
            timelock.isOperationReady(operationId),
            "Timelock operation is not ready"
        );

        vm.startBroadcast(deployerPrivateKey);

        timelock.execute(
            reputationSbtAddress,
            0,
            bootstrapReputationCall,
            bytes32(0),
            BOOTSTRAP_SALT
        );

        vm.stopBroadcast();
    }
}
