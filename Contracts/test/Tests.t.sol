// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployHelper} from "../script/DeployHelper.sol";
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

contract Tests is Test {
    DeployHelper.Deployment public deployed;

    function setUp() public {
        // call deployAll from test context; deployer will be address(this)
        deployed = DeployHelper.deployAll(address(this), 2 minutes, 7, 50, 50);
    }

    function testUserRegisteration() public {
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        assertEq(reg.isClient(address(this)), true);
    }

    function testJobLifeCycle() public {
        //declare
        address client = vm.addr(1);
        address freelancer = vm.addr(2);
        //send usd to client
        deal(address(deployed.usdc), client, 100 * 1e18);

        //register Client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Post Job
        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        bytes32[] memory ids = job.getAllJobIds();
        require(ids.length > 0, "No jobs found");
        bytes32 jobId = ids[0];

        //cancel Job
        vm.startPrank(client);
        job.cancelJob(ids[1]);
        vm.stopPrank();

        //Register Freelancer
        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        vm.startPrank(vm.addr(3));
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        //Change job
        vm.startPrank(client);
        job.updateJobDetails(
            jobId,
            "3243243",
            budget,
            bidDeadline,
            expireDeadline
        );
        vm.stopPrank();
        //submit bid
        vm.warp(START + 100);
        vm.startPrank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "Sample Ipfs");
        vm.stopPrank();

        //submit bid
        vm.warp(START + 100);
        vm.startPrank(vm.addr(3));
        job.submitBid(jobId, 10 * 1e18, "Sample Ipfs");
        vm.stopPrank();

        //Change job after bid submit expect revert
        vm.startPrank(client);
        vm.expectRevert();
        job.updateJobDetails(
            jobId,
            "3243243",
            budget,
            bidDeadline,
            expireDeadline
        );
        vm.stopPrank();

        //Reject bid
        vm.startPrank(client);
        job.rejectBid(jobId, 1);
        vm.stopPrank();

        //acceptBid
        vm.startPrank(client);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        usdc.approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        //Reject bid
        vm.startPrank(client);
        vm.expectRevert();
        job.rejectBid(jobId, 1);
        vm.stopPrank();

        //check status
        JobContract.JobStatus status = job.getJobStatus(jobId);
        assertEq(uint(status), uint(JobContract.JobStatus.InProgress));

        //Submit Work
        vm.startPrank(freelancer);
        job.submitWork(jobId, "This is the Proof");
        vm.stopPrank();

        (, , , , , , , , string memory ipfsProof, , , ) = job.jobs(jobId);

        assertEq(ipfsProof, "This is the Proof");

        //By Pass governance
        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        //accept Work
        vm.startPrank(client);
        job.acceptWork(jobId);
        vm.stopPrank();

        vm.startPrank(freelancer);
        job.rateClient(jobId, 9);
        vm.stopPrank();

        //Check Balance
        Treasury treasury = Treasury(address(deployed.treasury));
        console.log(usdc.balanceOf(deployed.treasury));
        console.log(usdc.balanceOf(freelancer));

        //Give ratings
        vm.startPrank(client);
        job.rateFreelancer(jobId, 8);
        vm.stopPrank();

        //Give rating twice
        vm.startPrank(client);
        vm.expectRevert();
        job.rateFreelancer(jobId, 8);
        vm.stopPrank();

        vm.startPrank(freelancer);
        vm.expectRevert();
        job.rateFreelancer(jobId, 8);
        vm.stopPrank();

        //Check Reputation
        uint256 tokenId = rep.getTokenId(freelancer);
        (
            uint32 completedJobs,
            uint32 failedJobs,
            uint32 disputeCount,
            uint16 ratingAverage, // 0–100
            uint16 reliabilityScore, // 0–100
            uint256 totalScore,
            uint256 lastUpdated,
            string memory metadataURI,
            bool revoked
        ) = rep.repData(tokenId);

        console.log("Completed Job", completedJobs);
        console.log("reliability Score", reliabilityScore);
        console.log("totalScore: ", totalScore);

        vm.startPrank(address(deployed.timelock));
        job.setReviewPeriod(108);
        job.setReputationAddress(freelancer);
        job.setTimelock(address(deployed.timelock));
        job.setRepPenalty(120);
        job.setRepReward(180);
        vm.stopPrank();

        vm.expectRevert();
        job.setRepPenalty(20);
    }

    function testBlockUnblockUser() public {
        address client = vm.addr(1);
        address freelancer = vm.addr(2);

        //register client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Block client
        vm.startPrank(address(deployed.timelock));
        reg.blockUser(client);
        vm.stopPrank();

        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        vm.expectRevert();
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        vm.startPrank(address(deployed.timelock));
        reg.unblockUser(client);
        vm.stopPrank();
    }

    function testSkillSBT() public {
        address client = vm.addr(1);
        address freelancer = vm.addr(2);

        //register client
        vm.startPrank(freelancer);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        //add coucil memeber
        vm.startPrank(address(deployed.timelock));
        CouncilRegistry council = CouncilRegistry(
            address(deployed.councilRegistry)
        );
        council.addCouncil(client);
        vm.stopPrank();

        vm.startPrank(client);
        SkillSBT sbt = SkillSBT(address(deployed.skillSBT));
        bytes32 id = keccak256(abi.encode("node.js"));
        sbt.mintSkill(freelancer, id, 82, 42, "This is uri");
        vm.stopPrank();

        vm.startPrank(client);
        sbt.upgradeSkill(1, 85, 87);
        vm.stopPrank();

        vm.expectRevert();
        sbt.transferFrom(freelancer, client, 0);

        vm.expectRevert();
        sbt.approve(freelancer, 0);

        vm.expectRevert();
        sbt.setApprovalForAll(freelancer, true);

        vm.startPrank(address(deployed.timelock));
        sbt.updateCouncilRegistry(freelancer);
        council.addCouncil(freelancer);
        address[] memory add = council.getCouncilMembers();
        console.log(add[0]);
        council.removeCouncil(freelancer);
        vm.stopPrank();


    }

    function testGovernance() public {
        address client = vm.addr(1);
        address freelancer = vm.addr(2);

        GoverContract gov = GoverContract(payable(address(deployed.governor)));
        //Add council memeber using governance
        bytes memory callData = abi.encodeWithSignature(
            "addCouncil(address)",
            client
        );

        address[] memory targets = new address[](1);
        targets[0] = address(deployed.councilRegistry);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = callData;

        string memory description = "Proposal #1: call doSomething";

        //Proposal Creation

        uint256 proposalId = gov.propose(
            targets,
            values,
            calldatas,
            description
        );

        assertTrue(proposalId != 0);
        assertEq(uint256(gov.state(proposalId)), 0);
        deal(address(deployed.govToken), client, 10000 * 1e18);

        GovernanceToken token = GovernanceToken(address(deployed.govToken));

        // delegate votes
        vm.prank(client);
        token.delegate(client);

        //Voting
        vm.roll(block.number + gov.votingDelay() + 1);

        // Voter1 votes for
        vm.prank(client);
        gov.castVote(proposalId, 1);

        vm.stopPrank();

        assertEq(gov.hasVoted(proposalId, client), true);

        vm.roll(block.number + gov.votingPeriod() + 1);

        assertEq(uint256(gov.state(proposalId)), 4);

        //Queue and Execute
        bytes32 descriptionHash = keccak256(
            bytes("Proposal #1: call doSomething")
        );

        gov.queue(targets, values, calldatas, descriptionHash);
        TimeLock timeLock = TimeLock(payable(address(deployed.timelock)));

        // timelock waiting period
        vm.warp(block.timestamp + timeLock.getMinDelay() + 1);

        gov.execute(targets, values, calldatas, descriptionHash);

        CouncilRegistry council = CouncilRegistry(
            address(deployed.councilRegistry)
        );
        assertEq(council.isCouncil(client), true);
    }

    function testFundCouncil() public {
        address member = vm.addr(1);
        deal(address(deployed.usdc), address(deployed.treasury), 100 * 1e18);

        vm.startPrank(address(deployed.timelock));
        CouncilRegistry council = CouncilRegistry(
            address(deployed.councilRegistry)
        );
        council.addCouncil(member);

        Treasury treasury = Treasury(deployed.treasury);
        treasury.addCouncilReward(member, 80 * 1e18);
        treasury.payCouncil(member);

        vm.stopPrank();

        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        assertEq(usdc.balanceOf(member), 80 * 1e18);
    }

    function testDisputeMechanism() public {
        //declare
        address client = vm.addr(1);
        address freelancer = vm.addr(2);
        //send usd to client
        deal(address(deployed.usdc), client, 100 * 1e18);

        //register Client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Post Job
        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        bytes32[] memory ids = job.getAllJobIds();
        require(ids.length > 0, "No jobs found");
        bytes32 jobId = ids[0];

        //Register Freelancer
        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        //submit bid
        vm.warp(START + 100);
        vm.startPrank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "Sample Ipfs");
        vm.stopPrank();

        //acceptBid
        vm.startPrank(client);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        usdc.approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        //Submit Work
        vm.startPrank(freelancer);
        job.submitWork(jobId, "This is the Proof");
        vm.stopPrank();

        (, , , , , , , , string memory ipfsProof, , , ) = job.jobs(jobId);

        assertEq(ipfsProof, "This is the Proof");

        //By Pass governance
        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        //Raise dispute
        vm.startPrank(client);
        job.raiseDispute(jobId, "Work not completed good");
        vm.stopPrank();

        vm.startPrank(address(deployed.timelock));
        job.resolveDispute(jobId, client);
        vm.stopPrank();

        console.log("client Balance: ", usdc.balanceOf(client));
        assertEq(usdc.balanceOf(client), 100 * 1e18);

        uint256 id = rep.getTokenId(freelancer);

        vm.startPrank(address(deployed.timelock));
        rep.revokeReputation(1, "hh");
        vm.stopPrank();

        vm.startPrank(address(deployed.timelock));
        rep.setJobContract(vm.addr(1));
        vm.stopPrank();

        vm.startPrank(address(deployed.timelock));
        rep.setTimelock(client);
        vm.stopPrank();

        vm.expectRevert();
        rep.transferFrom(freelancer, client, 3);

        vm.expectRevert();
        rep.approve(client, 1);

        vm.expectRevert();
        rep.setApprovalForAll(client, true);
    }

    function testClaimAfterReviewPeriod() public {
        //declare
        address client = vm.addr(1);
        address freelancer = vm.addr(2);
        //send usd to client
        deal(address(deployed.usdc), client, 100 * 1e18);

        //register Client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Post Job
        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        bytes32[] memory ids = job.getAllJobIds();
        require(ids.length > 0, "No jobs found");
        bytes32 jobId = ids[0];

        //Register Freelancer
        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        //submit bid
        vm.warp(START + 100);
        vm.startPrank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "Sample Ipfs");
        vm.stopPrank();

        //acceptBid
        vm.startPrank(client);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        usdc.approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        //Submit Work
        vm.startPrank(freelancer);
        job.submitWork(jobId, "This is the Proof");
        vm.stopPrank();

        (, , , , , , , , string memory ipfsProof, , , ) = job.jobs(jobId);

        assertEq(ipfsProof, "This is the Proof");

        //By Pass governance
        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        vm.warp(block.timestamp + 8 days);
        vm.startPrank(freelancer);
        job.claimAfterReviewPeriod(jobId);
        vm.stopPrank();

        console.log("Freelancer balance: ", usdc.balanceOf(freelancer) / 1e18);
    }

    function testClaimAfterExpiredDeadline() public {
        //declare
        address client = vm.addr(1);
        address freelancer = vm.addr(2);
        //send usd to client
        deal(address(deployed.usdc), client, 100 * 1e18);

        //register Client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Post Job
        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        bytes32[] memory ids = job.getAllJobIds();
        require(ids.length > 0, "No jobs found");
        bytes32 jobId = ids[0];

        //Register Freelancer
        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        reg.isUserExist(freelancer);

        assertEq(reg.isFreelancer(freelancer), true);
        assertEq(false, reg.isClient(freelancer));
        assertEq(true, reg.isUserExist(freelancer));
        assertEq(false, reg.isBlocked(freelancer));
        //submit bid
        vm.warp(START + 100);
        vm.startPrank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "Sample Ipfs");
        vm.stopPrank();

        //acceptBid
        vm.startPrank(client);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        usdc.approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        //By Pass governance
        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        vm.warp(block.timestamp + expireDeadline);
        vm.startPrank(client);
        job.claimAfterExpiredDeadline(jobId);
        vm.stopPrank();

        console.log("Balance of client: ", usdc.balanceOf(client) / 1e18);
    }

    function testFundDev() public {
        address member = vm.addr(1); //dev
        deal(address(deployed.usdc), address(deployed.treasury), 100 * 1e18);

        vm.startPrank(address(deployed.timelock));

        Treasury treasury = Treasury(deployed.treasury);
        treasury.addDeveloperReward(member, 50 * 1e18);
        treasury.payDeveloper(member);
        vm.stopPrank();

        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        assertEq(usdc.balanceOf(member), 50 * 1e18);

        vm.startPrank(address(deployed.timelock));
        treasury.emergencyWithdraw(vm.addr(1), 50*1e18);
        treasury.setCouncilRegistry(vm.addr(1));
        treasury.setTimelock(member); //Just for checking is it working
    }

    function testCancelJob() public {
        //declare
        address client = vm.addr(1);
        address freelancer = vm.addr(2);
        //send usd to client
        deal(address(deployed.usdc), client, 100 * 1e18);

        //register Client
        vm.startPrank(client);
        UserRegistry reg = UserRegistry(deployed.registry);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        //Post Job
        JobContract job = JobContract(deployed.jobContract);
        uint256 START = 1000;
        vm.warp(START);
        uint256 budget = 8 * 1e18;
        uint256 bidDeadline = START + 1 days;
        uint256 expireDeadline = START + 2 days;

        vm.startPrank(client);
        job.createJob("ipfs:https://", budget, bidDeadline, expireDeadline);
        vm.stopPrank();

        bytes32[] memory ids = job.getAllJobIds();
        require(ids.length > 0, "No jobs found");
        bytes32 jobId = ids[0];

        vm.startPrank(client);
        job.cancelJob(jobId);
        vm.stopPrank();

        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        vm.expectRevert();
        job.submitBid(jobId, 10 * 1e18, "My Proposal");
    }

    function testSetTimeLock() public {
        vm.startPrank(address(deployed.timelock));
        UserRegistry reg = UserRegistry(deployed.registry);
        address add = vm.addr(1);
        reg.setTimelock(add);
        vm.stopPrank();

        vm.expectRevert();
        reg.setTimelock(add);
    }

    function testSetFeeInEscrow() public {
        vm.startPrank(address(deployed.timelock));
        JobContract job = JobContract(deployed.jobContract);
        job.setFee(400, 800);
       
        job.setTimelock(vm.addr(1));

        vm.stopPrank();
    }
}
