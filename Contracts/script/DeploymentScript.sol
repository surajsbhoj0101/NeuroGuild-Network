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
    uint256 constant DEFAULT_REVIEW_PERIOD_DAYS = 7;
    uint256 constant DEFAULT_REP_REWARD = 20;
    uint256 constant DEFAULT_REP_PENALTY = 20;
    uint256 constant DEFAULT_MIN_DELAY = 1 days;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 reviewPeriodDays = vm.envOr(
            "REVIEW_PERIOD_DAYS",
            DEFAULT_REVIEW_PERIOD_DAYS
        );
        uint256 repReward = vm.envOr("REP_REWARD", DEFAULT_REP_REWARD);
        uint256 repPenalty = vm.envOr("REP_PENALTY", DEFAULT_REP_PENALTY);
        uint256 minDelay = vm.envOr("MIN_DELAY_SECONDS", DEFAULT_MIN_DELAY);

        require(reviewPeriodDays > 1 && reviewPeriodDays <= type(uint8).max, "invalid REVIEW_PERIOD_DAYS");
        require(repReward <= type(uint8).max, "invalid REP_REWARD");
        require(repPenalty <= type(uint8).max, "invalid REP_PENALTY");

        console.log("Deploying with:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        DeployHelper.Deployment memory d = DeployHelper.deployAll(
            deployer,
            minDelay,
            uint8(reviewPeriodDays),
            uint8(repReward),
            uint8(repPenalty)
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
