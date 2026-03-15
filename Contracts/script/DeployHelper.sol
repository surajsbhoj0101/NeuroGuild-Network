// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Usdc} from "../src/test_token/ERC20Usdc.sol";
import {UserRegistry} from "../src/user/UserRegistry.sol";
import {ReputationSBT} from "../src/sbt/ReputationSBT.sol";
import {SkillSBT} from "../src/sbt/SkillSBT.sol";
import {JobContract} from "../src/jobs/JobContract.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {GovernanceToken} from "../src/dao/GovernanceToken.sol";
import {
    GoverContract
} from "../src/dao/governance_standard/GovernerContract.sol";
import {TimeLock} from "../src/dao/governance_standard/TimeLock.sol";
import {Box} from "../src/dao/Box.sol";
import {CouncilRegistry} from "../src/dao/CouncilRegistry.sol";
import {Treasury} from "../src/dao/Treasury.sol";

library DeployHelper {
    bytes32 internal constant BOOTSTRAP_SALT =
        keccak256("bootstrap-reputation-job-contract");

    struct Deployment {
        address usdc;
        address govToken;
        address timelock;
        address governor;
        address councilRegistry;
        address reputationSBT;
        address skillSBT;
        address registry;
        address treasury;
        address jobContract;
        address box;
    }

    function deployAll(
        address deployer,
        uint256 minDelay,
        uint8 reviewPeriodDays,
        uint8 repReward,
        uint8 repPenalty
    ) internal returns (Deployment memory d) {
        // USDC test token
        ERC20Usdc usdc = new ERC20Usdc();
        d.usdc = address(usdc);

        // Governance token
        GovernanceToken govToken = new GovernanceToken();
        d.govToken = address(govToken);

        // Timelock starts with empty proposer/executor sets.
        // Deployer is temporary admin only for role wiring.
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);

        TimeLock timelock = new TimeLock(
            minDelay,
            proposers,
            executors,
            deployer
        );
        d.timelock = address(timelock);

        ReputationSBT reputationSBT = new ReputationSBT(address(timelock));
        d.reputationSBT = address(reputationSBT);

        GoverContract governor = new GoverContract(
            govToken,
            timelock,
            address(reputationSBT)
        );
        d.governor = address(governor);

        CouncilRegistry councilRegistry = new CouncilRegistry(
            address(timelock),
            address(usdc)
        );
        d.councilRegistry = address(councilRegistry);

        SkillSBT skillSBT = new SkillSBT(
            address(timelock),
            address(councilRegistry)
        );
        d.skillSBT = address(skillSBT);

        UserRegistry registry = new UserRegistry(address(timelock));
        d.registry = address(registry);

        Treasury treasury = new Treasury(
            address(timelock),
            address(usdc),
            address(councilRegistry)
        );
        d.treasury = address(treasury);

        JobContract jobContract = new JobContract(
            address(registry),
            address(usdc),
            reviewPeriodDays,
            address(timelock),
            repReward,
            repPenalty,
            address(reputationSBT),
            address(treasury),
            address(councilRegistry)
        );
        d.jobContract = address(jobContract);

        // Box (timelock)
        Box box = new Box(address(timelock));
        d.box = address(box);

        bytes memory bootstrapReputationCall = abi.encodeCall(
            ReputationSBT.setJobContract,
            (address(jobContract))
        );

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.PROPOSER_ROLE(), deployer);
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));

        timelock.schedule(
            address(reputationSBT),
            0,
            bootstrapReputationCall,
            bytes32(0),
            BOOTSTRAP_SALT,
            minDelay
        );

        if (minDelay == 0) {
            timelock.execute(
                address(reputationSBT),
                0,
                bootstrapReputationCall,
                bytes32(0),
                BOOTSTRAP_SALT
            );
        }

        timelock.revokeRole(timelock.PROPOSER_ROLE(), deployer);
        governor.renounceAdmin();
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), deployer);

        return d;
    }
}
