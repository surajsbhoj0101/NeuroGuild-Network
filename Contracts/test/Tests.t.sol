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

    function testUnregisteredUserCannotCreateJob() public {
        JobContract job = JobContract(deployed.jobContract);
        uint256 start = 1000;
        vm.warp(start);

        vm.startPrank(vm.addr(99));
        vm.expectRevert(UserRegistry.UserNotRegistered.selector);
        job.createJob(
            "ipfs:https://",
            8 * 1e18,
            start + 1 days,
            start + 2 days
        );
        vm.stopPrank();
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

        string memory ipfsProof = job.getJob(jobId).ipfsProof[0];
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
        assertEq(usdc.balanceOf(deployed.treasury), 12 * 1e17); // 1.2 USDC
        assertEq(usdc.balanceOf(address(job)), 0); // no stranded client fee

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

        GoverContract gov = GoverContract(payable(address(deployed.governor)));
        TimeLock timeLock = TimeLock(payable(address(deployed.timelock)));
        GovernanceToken token = GovernanceToken(address(deployed.govToken));

        // Ensure deployer/test contract is no longer timelock admin or proposer.
        assertEq(
            timeLock.hasRole(timeLock.DEFAULT_ADMIN_ROLE(), address(this)),
            false
        );
        assertEq(
            timeLock.hasRole(timeLock.PROPOSER_ROLE(), address(this)),
            false
        );
        assertEq(timeLock.hasRole(timeLock.PROPOSER_ROLE(), address(gov)), true);

        // Non-proposer cannot schedule directly on timelock.
        vm.startPrank(client);
        vm.expectRevert();
        timeLock.schedule(address(0), 0, "", bytes32(0), bytes32(0), 2 minutes);
        vm.stopPrank();

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

        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        vm.prank(address(deployed.jobContract));
        rep.mintReputation(client, "");

        deal(address(deployed.govToken), client, 10000 * 1e18);

        vm.prank(client);
        token.delegate(client);
        vm.roll(block.number + 1);

        //Proposal Creation
        vm.prank(client);
        uint256 proposalId = gov.propose(targets, values, calldatas, description);

        assertTrue(proposalId != 0);
        assertEq(uint256(gov.state(proposalId)), 0);

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

        // timelock waiting period
        vm.warp(block.timestamp + timeLock.getMinDelay() + 1);

        gov.execute(targets, values, calldatas, descriptionHash);

        CouncilRegistry council = CouncilRegistry(
            address(deployed.councilRegistry)
        );
        assertEq(council.isCouncil(client), true);

        // second governance action: rotate UserRegistry timelock
        address newTimelock = vm.addr(777);
        bytes memory setTlData = abi.encodeWithSignature(
            "setTimelock(address)",
            newTimelock
        );

        address[] memory targets2 = new address[](1);
        targets2[0] = address(deployed.registry);

        uint256[] memory values2 = new uint256[](1);
        values2[0] = 0;

        bytes[] memory calldatas2 = new bytes[](1);
        calldatas2[0] = setTlData;

        string memory description2 = "Proposal #2: rotate registry timelock";
        vm.prank(client);
        uint256 proposalId2 = gov.propose(
            targets2,
            values2,
            calldatas2,
            description2
        );

        vm.roll(block.number + gov.votingDelay() + 1);
        vm.prank(client);
        gov.castVote(proposalId2, 1);

        vm.roll(block.number + gov.votingPeriod() + 1);
        bytes32 descHash2 = keccak256(bytes(description2));
        gov.queue(targets2, values2, calldatas2, descHash2);
        vm.warp(block.timestamp + timeLock.getMinDelay() + 1);
        gov.execute(targets2, values2, calldatas2, descHash2);

        UserRegistry registry = UserRegistry(deployed.registry);
        assertEq(registry.timelock(), newTimelock);
    }

    function testEscrowNoStrandedBalanceOnCompletion() public {
        address client = vm.addr(11);
        address freelancer = vm.addr(12);

        deal(address(deployed.usdc), client, 100 * 1e18);

        UserRegistry reg = UserRegistry(deployed.registry);
        vm.startPrank(client);
        reg.registerUser(UserRegistry.Role.Client);
        vm.stopPrank();

        vm.startPrank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);
        vm.stopPrank();

        JobContract job = JobContract(deployed.jobContract);
        uint256 start = 1000;
        vm.warp(start);
        vm.startPrank(client);
        job.createJob("ipfs:https://", 8 * 1e18, start + 1 days, start + 2 days);
        vm.stopPrank();
        bytes32 jobId = job.getAllJobIds()[0];

        vm.startPrank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "Sample");
        vm.stopPrank();

        vm.startPrank(client);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        usdc.approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        vm.startPrank(freelancer);
        job.submitWork(jobId, "proof");
        vm.stopPrank();

        vm.startPrank(address(deployed.timelock));
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));
        rep.setJobContract(address(deployed.jobContract));
        vm.stopPrank();

        vm.startPrank(client);
        job.acceptWork(jobId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(job)), 0);
        assertEq(usdc.balanceOf(freelancer), 91 * 1e17); // 9.1 after council fee
        assertEq(usdc.balanceOf(deployed.treasury), 12 * 1e17); // 1.2
        assertEq(usdc.balanceOf(deployed.councilRegistry), 2 * 1e17); // 0.2
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

    function testRemovedCouncilCanStillClaimAccruedRewards() public {
        address member = vm.addr(31);
        ERC20Usdc usdc = ERC20Usdc(deployed.usdc);
        CouncilRegistry council = CouncilRegistry(address(deployed.councilRegistry));

        deal(address(usdc), address(council), 10 * 1e18);

        vm.startPrank(address(deployed.timelock));
        council.addCouncil(member);
        council.notifyPoolContribution(10 * 1e18);
        vm.warp(block.timestamp + 31 days);
        council.distributeMonthlyPool();
        council.removeCouncil(member);
        vm.stopPrank();

        vm.prank(member);
        council.claimCouncilReward();

        assertEq(usdc.balanceOf(member), 10 * 1e18);
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

        string memory ipfsProof = job.getJob(jobId).ipfsProof[0];
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

    function testCanReRaiseUnresolvedDisputeAfterCooldown() public {
        address client = vm.addr(11);
        address freelancer = vm.addr(12);
        deal(address(deployed.usdc), client, 100 * 1e18);

        UserRegistry reg = UserRegistry(deployed.registry);
        JobContract job = JobContract(deployed.jobContract);

        vm.prank(client);
        reg.registerUser(UserRegistry.Role.Client);

        vm.prank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);

        uint256 start = 1000;
        vm.warp(start);

        vm.prank(client);
        job.createJob("ipfs://job", 8 * 1e18, start + 1 days, start + 2 days);

        bytes32 jobId = job.getAllJobIds()[0];

        vm.warp(start + 100);
        vm.prank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "ipfs://proposal");

        vm.startPrank(client);
        ERC20Usdc(deployed.usdc).approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        vm.prank(freelancer);
        job.submitWork(jobId, "ipfs://proof");

        vm.prank(client);
        job.raiseDispute(jobId, "ipfs://reason-1");

        assertEq(job.disputeRaiseCount(jobId), 1);

        vm.prank(client);
        vm.expectRevert(JobContract.DisputeReraiseTooEarly.selector);
        job.reRaiseDispute(jobId, "ipfs://reason-2");

        vm.warp(block.timestamp + job.disputeReraiseCooldown());
        vm.prank(freelancer);
        job.reRaiseDispute(jobId, "ipfs://reason-2");

        assertEq(job.disputeRaiseCount(jobId), 2);
        assertEq(uint256(job.getJobStatus(jobId)), uint256(JobContract.JobStatus.Disputed));
    }

    function testAutoMintedReputationUsesDefaultMetadataURI() public {
        address client = vm.addr(21);
        address freelancer = vm.addr(22);
        deal(address(deployed.usdc), client, 100 * 1e18);

        UserRegistry reg = UserRegistry(deployed.registry);
        JobContract job = JobContract(deployed.jobContract);
        ReputationSBT rep = ReputationSBT(address(deployed.reputationSBT));

        vm.prank(client);
        reg.registerUser(UserRegistry.Role.Client);

        vm.prank(freelancer);
        reg.registerUser(UserRegistry.Role.Freelancer);

        vm.startPrank(address(deployed.timelock));
        rep.setJobContract(address(job));
        job.setDefaultReputationMetadataURI("ipfs://reputation-cid");
        vm.stopPrank();

        uint256 start = 2000;
        vm.warp(start);

        vm.prank(client);
        job.createJob("ipfs://job", 8 * 1e18, start + 1 days, start + 2 days);

        bytes32 jobId = job.getAllJobIds()[0];

        vm.warp(start + 100);
        vm.prank(freelancer);
        job.submitBid(jobId, 10 * 1e18, "ipfs://proposal");

        vm.startPrank(client);
        ERC20Usdc(deployed.usdc).approve(address(job), 20 * 1e18);
        job.acceptBid(jobId, 0);
        vm.stopPrank();

        vm.prank(freelancer);
        job.submitWork(jobId, "ipfs://proof");

        vm.prank(client);
        job.acceptWork(jobId);

        uint256 tokenId = rep.getTokenId(freelancer);
        (, , , , , , , string memory metadataURI, ) = rep.repData(tokenId);

        assertEq(metadataURI, "ipfs://reputation-cid");
        assertEq(rep.tokenURI(tokenId), "ipfs://reputation-cid");
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

        string memory ipfsProof = job.getJob(jobId).ipfsProof[0];
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
