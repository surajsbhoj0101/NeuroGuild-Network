// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {UserRegistry} from "../src/user/UserRegistry.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {SkillSBT} from "../src/sbt/SkillSBT.sol";
import {JobContract} from "../src/jobs/JobContract.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {ERC20Usdc} from "../src/test_token/ERC20Usdc.sol";

import {GovernanceToken} from "../src/dao/GovernanceToken.sol";
import {
    GoverContract
} from "../src/dao/governance_standard/GovernerContract.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import {Box} from "../src/dao/Box.sol";

contract ProtocolDeployTest is Test {
    GovernanceToken govToken;
    GoverContract governor;
    TimeLock timelock;
    ReputationSBT repSBT;
    UserRegistry registry;
    JobContract jobContract;
    ERC20Usdc usdc;

    function setUp() public {
        repSBT = new ReputationSBT();
        govToken = new GovernanceToken();

        address[] memory proposers = new address[](1);
        proposers[0] = msg.sender;

        address[] memory executors = new address[](1);
        executors[0] = msg.sender;

        timelock = new TimeLock(2 minutes, proposers, executors, address(this));

        governor = new GoverContract(govToken, timelock, address(repSBT));

        registry = new UserRegistry(address(governor), address(this));
        usdc = new ERC20Usdc();

        jobContract = new JobContract(
            address(registry),
            address(usdc),
            7,
            address(governor),
            50,
            50,
            address(repSBT)
        );
    }

    function testDeployment() public {
        assertTrue(address(governor) != address(0));
        assertTrue(address(timelock) != address(0));
        assertTrue(address(jobContract) != address(0));
        assertTrue(address(repSBT) != address(0));
    }

    // function testUserCreation()
}
