// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UserRegistry} from "./interfaces/UserRegistry.sol";
import {Escrow} from "../escrow/Escrow.sol";

contract JobContract is Escrow {
    error OnlyClientAllowed();
    error OnlyFreelancerAllowed();
    error DeadlineMustBeInFuture();
    error AmountShouldBeGreaterThanOffer();
    error OnlyOpenJobs();
    error OnlyInProgressJobs();
    error NotJobClient();
    error InvalidBidIndex();
    error OnlyBidOnce();
    error cannotSubmitBidDeadlineExceed();
    error cannotAcceptBidDeadlineExceed();
    error cannotSubmitWorkDeadlineExceeded();
    error NotAssignedFreelancer();
    error CannotEditAfterExpiry();
    error WorkAlreadySubmitted();
    error NotJobParticipant();
    error DisputePeriodOver();
    error DisputeAlreadyRaised();
    error OnlySubmittedJobs();
    error ReviewPeriodStillActive();
    error ReviewPeroidMustBeGreaterThanOne();

    event DisputeRaised(bytes32 indexed jobId, address indexed by);
    event DisputeResolved(
        bytes32 indexed jobId,
        address winner,
        uint256 payout
    );

    event JobCreated(
        bytes32 indexed jobId,
        address indexed client,
        uint256 budget,
        uint256 bidDeadline,
        uint256 expireDeadline,
        string ipfs
    );

    event JobDetailsUpdated(
        bytes32 indexed jobId,
        address indexed client,
        uint256 budget,
        uint256 bidDeadline,
        uint256 expireDeadline,
        string ipfs
    );

    event BidSubmitted(
        bytes32 indexed jobId,
        address indexed freelancer,
        uint256 amount,
        uint256 bidIndex
    );

    event JobExpireDeadlineIncreased(bytes32 indexed jobId,uint256 exceedTimeBy)
    event JobStarted(bytes32 indexed jobId, address indexed freelancer);
    event JobCompleted(bytes32 indexed jobId, address indexed freelancer);
    event BidAccepted(
        bytes32 indexed jobId,
        address indexed freelancer,
        uint256 amount,
        uint256 bidIndex
    );
    event WorkSubmitted(
        bytes32 indexed jobId,
        address indexed freelancer,
        string ipfsProof
    );
    event JobCancelled(bytes32 indexed jobId, address indexed client);

    enum JobStatus {
        Open,
        InProgress,
        Submitted,
        Completed,
        Disputed,
        Cancelled,
        Expired
    }

    struct Job {
        bytes32 jobId;
        address client;
        address freelancer;
        uint256 budget;
        uint256 bidDeadline;
        uint256 expireDeadline;
        JobStatus status;
        string ipfs;
        string ipfsProof;
        uint256 createdAt;
        uint256 submittedAt;
        bool disputed;
    }

    struct Bid {
        bytes32 jobId;
        address freelancer;
        uint256 amount;
        uint256 createdAt;
    }

    address public owner;
    UserRegistry public registry;
    address public governance;
    uint256 public totalJobs;
    uint256 public reviewPeriod;
    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => Bid[]) public jobBids;
    mapping(bytes32 => mapping(address => bool)) public hasBid;
    bytes32[] public allJobIds;
    uint256 public constant MAX_REPUTATION = 1000;

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    modifier onlyClient() {
        if (!registry.isClient(msg.sender)) revert OnlyClientAllowed();
        _;
    }

    modifier onlyFreelancer() {
        if (!registry.isFreelancer(msg.sender)) revert OnlyFreelancerAllowed();
        _;
    }

    modifier onlyOpenJob(bytes32 jobId) {
        if (jobs[jobId].status != JobStatus.Open) revert OnlyOpenJobs();
        _;
    }

    constructor(
        address _registryAddress,
        address token,
        uint8 initialReviewPeriod,
        address _governance
    ) Escrow(token) {
        registry = UserRegistry(_registryAddress);
        reviewPeriod = initialReviewPeriod; //Indays
        governance = _governance;
    }

    function setReviewPeriod(uint8 _reviewPeriod) external onlyGovernance {
        if (_reviewPeriod <= 1) revert ReviewPeroidMustBeGreaterThanOne();
        reviewPeriod = _reviewPeriod;
    }

    function setGovernor(address _governance) external onlyGovernance {
        governance = _governance;
    }

    function createJob(
        string memory ipfsLink,
        uint256 budget,
        uint256 bidDeadline,
        uint256 expireDeadline
    ) external onlyClient {
        if (bidDeadline <= expireDeadline)
            revert ExpireDeadlineMustBeGreaterThanBid();
        if (bidDeadline <= block.timestamp) revert DeadlineMustBeInFuture();

        bytes32 jobId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, totalJobs)
        );

        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: address(0),
            budget: budget,
            bidDeadline: bidDeadline,
            expireDeadline: expireDeadline,
            status: JobStatus.Open,
            ipfs: ipfsLink,
            ipfsProof: "",
            createdAt: block.timestamp,
            submittedAt: 0,
            disputed: false
        });

        allJobIds.push(jobId);
        totalJobs++;

        emit JobCreated(
            jobId,
            msg.sender,
            budget,
            bidDeadline,
            expireDeadline,
            ipfsLink
        );
    }

    function submitBid(
        bytes32 jobId,
        uint256 bidAmount
    ) external onlyFreelancer onlyOpenJob(jobId) {
        if (bidAmount >= jobs[jobId].budget)
            revert AmountShouldBeGreaterThanOffer();
        if (jobs[jobId].bidDeadline < block.timestamp)
            revert cannotSubmitBidDeadlineExceed();

        if (hasBid[jobId][msg.sender]) revert OnlyBidOnce();

        Bid memory newBid = Bid({
            jobId: jobId,
            freelancer: msg.sender,
            amount: bidAmount,
            createdAt: block.timestamp
        });

        uint256 bidIndex = jobBids[jobId].length;
        jobBids[jobId].push(newBid);
        hasBid[jobId][msg.sender] = true;

        emit BidSubmitted(jobId, msg.sender, bidAmount, bidIndex);
    }

    function acceptBid(bytes32 jobId, uint256 bidIndex) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.bidDeadline < block.timestamp)
            revert cannotAcceptBidDeadlineExceed();
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.Open) revert OnlyOpenJobs();

        Bid[] storage bids = jobBids[jobId];
        if (bidIndex >= bids.length) revert InvalidBidIndex();

        Bid storage chosenBid = bids[bidIndex];
        job.status = JobStatus.InProgress;
        job.freelancer = chosenBid.freelancer;
        job.submittedAt = block.timestamp;
        _lockFunds(jobId, chosenBid.amount, chosenBid.freelancer);

        emit JobStarted(jobId, chosenBid.freelancer);
    }

    function submitWork(
        bytes32 jobId,
        string memory ipfsProof
    ) external onlyFreelancer {
        Job storage job = jobs[jobId];
        if (bytes(job.ipfsProof).length != 0) revert WorkAlreadySubmitted();
        if (job.freelancer != msg.sender) revert NotAssignedFreelancer();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();

        job.ipfsProof = ipfsProof;
    }

    function acceptWork(bytes32 jobId) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.expireDeadline < block.timestamp)
            revert cannotSubmitWorkDeadlineExceeded();
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;
        _changeRep(job.freelancer, 50);
        _changeRep(job.client, 50);
        emit JobCompleted(jobId, job.freelancer);
    }

    function increaseExpireDeadline(
        bytes32 jobId,
        uint256 exceedTimeBy
    ) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();

        job.expireDeadline += exceedTimeBy;
        emit JobExpireDeadlineIncreased(jobId, exceedTimeBy);
    }

    function raiseDispute(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert OnlySubmittedJobs();
        if (job.disputed) revert DisputeAlreadyRaised();

        if (msg.sender != job.client && msg.sender != job.freelancer)
            revert NotJobParticipant();

        if (block.timestamp > job.submittedAt + reviewPeriod)
            revert DisputePeriodOver();

        job.status = JobStatus.Disputed;
        job.disputed = true;

        emit DisputeRaised(jobId, msg.sender);
    }

    function editJobDetails(
        bytes32 jobId,
        string memory ipfsLink,
        uint256 budget,
        uint256 bidDeadline
    ) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (block.timestamp > job.bidDeadline) revert CannotEditAfterExpiry();

        require(jobBids[jobId].length == 0, "Cannot edit with bids");

        if (job.status != JobStatus.Open) revert OnlyOpenJobs();
        if (bidDeadline <= block.timestamp) revert DeadlineMustBeInFuture();

        job.budget = budget;
        job.bidDeadline = bidDeadline;
        job.ipfs = ipfsLink;

        emit JobDetailsUpdated(
            jobId,
            msg.sender,
            budget,
            bidDeadline,
            ipfsLink
        );
    }

    function cancelJob(bytes32 jobId) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.Open) revert OnlyOpenJobs();
        job.status = JobStatus.Cancelled;
        emit JobCancelled(jobId, msg.sender);
    }

    function claimAfterReviewPeriod(bytes32 jobId) external onlyFreelancer {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert OnlySubmittedJobs();
        if (job.disputed) revert DisputeAlreadyRaised();

        if (block.timestamp <= job.submittedAt + reviewPeriod)
            revert ReviewPeriodStillActive();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;

        emit JobCompleted(jobId, job.freelancer);
    }

    function _changeRep(address user, uint256 amount) internal {
        //change reputation of user
    }

    function resolveDispute(
        bytes32 jobId,
        address winner,
        uint256 payout
    ) external onlyGovernance {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Not disputed");

        if (winner == job.freelancer) {
            _releaseFunds(jobId);
        } else if (winner == job.client) {
            _refundClient(jobId);
        } else {}

        job.status = JobStatus.Completed;
        emit DisputeResolved(jobId, winner, payout);
    }

    function getJobStatus(bytes32 jobId) external view returns (JobStatus) {
        return jobs[jobId].status;
    }

    function getBids(bytes32 jobId) external view returns (Bid[] memory) {
        return jobBids[jobId];
    }

    function getAllJobIds() external view returns (bytes32[] memory) {
        return allJobIds;
    }

    function getJob(bytes32 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }
}
