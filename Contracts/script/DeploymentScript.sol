// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {DeployHelper} from "./DeployHelper.sol";
import {ERC20Usdc} from "../src/test_token/ERC20Usdc.sol";
import {UserRegistry} from "../src/user/UserRegistry.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {SkillSBT} from "../src/sbt/SkillSBT.sol";
import {JobContract} from "../src/jobs/JobContract.sol";
import {GovernanceToken} from "../src/dao/GovernanceToken.sol";
import {GoverContract} from "../src/dao/governance_standard/GovernerContract.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import {Box} from "../src/dao/Box.sol";
import {CouncilRegistry} from "../src/dao/CouncilRegistry.sol";
import {Treasury} from "../src/dao/Treasury.sol";

contract DeploymentScript is Script {
    uint8 constant REVIEW_PERIOD_DAYS = 7;
    uint8 constant REP_REWARD = 50;
    uint8 constant REP_PENALTY = 50;
    uint256 constant MIN_DELAY = 2 minutes;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying with:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        DeployHelper.Deployment memory d = DeployHelper.deployAll(
            deployer,
            MIN_DELAY,
            REVIEW_PERIOD_DAYS,
            REP_REWARD,
            REP_PENALTY
        );

        console.log("USDC:", d.usdc);
        console.log("GovernanceToken:", d.govToken);
        console.log("Timelock:", d.timelock);
        console.log("Governor:", d.governor);
        console.log("CouncilRegistry:", d.councilRegistry);
        console.log("ReputationSBT:", d.reputationSBT);
        console.log("SkillSBT:", d.skillSBT);
        console.log("UserRegistry:", d.registry);
        console.log("Treasury:", d.treasury);
        console.log("JobContract:", d.jobContract);
        console.log("Box:", d.box);

     
       

        vm.stopBroadcast();
    }
}
