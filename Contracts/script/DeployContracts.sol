// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UserRegistry} from "../src/user/UserRegistry.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {SkillSBT} from "../src/sbt/SkillSBT.sol";
import {JobContract} from "../src/jobs/JobContract.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {console} from "forge-std/console.sol";

import {
    GoverContract
} from "../src/dao/governance_standard/GovernerContract.sol";

import {GovernanceToken} from "../src/dao/GovernanceToken.sol";
import {Box} from "../src/dao/Box.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";

contract DeployContracts is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // vm.startBroadcast(deployerPrivateKey);
        vm.startBroadcast();

        // -----------------------------------------------------
        // 1. Deploy Core SBT + Registry System
        // -----------------------------------------------------
        SkillSBT skillSbt = new SkillSBT(msg.sender);
        ReputationSBT reputationSBT = new ReputationSBT();

        // -----------------------------------------------------
        // 2. Deploy DAO Governance System
        // -----------------------------------------------------
        GovernanceToken governanceToken = new GovernanceToken();

        // TimeLock Params
        uint256 minDelay = 2 minutes;
        address[] memory proposers = new address[](1);
        proposers[0] = msg.sender;

        address[] memory executors = new address[](1);
        executors[0] = msg.sender;

        TimeLock timelock = new TimeLock(
            minDelay,
            proposers,
            executors,
            msg.sender
        );

        GoverContract governor = new GoverContract(
            governanceToken,
            timelock,
            address(reputationSBT)
        );

       
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), msg.sender);

        // -----------------------------------------------------
        // 3. Deploy DAO-Controlled Box Contract
        // -----------------------------------------------------
        Box box = new Box(address(timelock));

        // -----------------------------------------------------
        // 4. Deploy User Registry
        // -----------------------------------------------------
        UserRegistry userRegistry = new UserRegistry(
            address(governor),
            msg.sender
        );

        // -----------------------------------------------------
        // 5. Deploy Job + Escrow System
        // -----------------------------------------------------

        uint8 initialReviewPeriod = 7;
        uint8 initialReward = 50;
        uint8 initialPenalty = 50;

        JobContract jobContract = new JobContract(
            address(userRegistry),
            address(0xAF33ADd7918F685B2A82C1077bd8c07d220FFA04),
            initialReviewPeriod,
            address(governor),
            initialReward,
            initialPenalty,
            address(reputationSBT)
        );

        console.log("--- Deployment Addresses ---");

        console.log("SkillSBT: ", address(skillSbt));

        console.log("ReputationSBT: ", address(reputationSBT));

        console.log("UserRegistry: ", address(userRegistry));

        console.log("GovernanceToken: ", address(governanceToken));

        console.log("TimeLock: ", address(timelock));

        console.log("Governor: ", address(governor));

        console.log("Box: ", address(box));

        console.log("JobContract: ", address(jobContract));
        vm.stopBroadcast();
    }
}
