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
    error NotAssignedFreelancer();
    error CannotEditAfterExpiry();
    error WorkAlreadySubmitted();
    error NotJobParticipant();
    error DisputePeriodOver();
    error DisputeAlreadyRaised();
    error OnlySubmittedJobs();
    error ReviewPeriodStillActive();

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
        uint256 deadline,
        string ipfs
    );

    event JobDetailsUpdated(
        bytes32 indexed jobId,
        address indexed client,
        uint256 budget,
        uint256 deadline,
        string ipfs
    );

    event BidSubmitted(
        bytes32 indexed jobId,
        address indexed freelancer,
        uint256 amount,
        uint256 bidIndex
    );
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
        Cancelled
    }

    struct Job {
        bytes32 jobId;
        address client;
        address freelancer;
        uint256 budget;
        uint256 deadline;
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
    address public resolver;
    uint256 public totalJobs;
    uint256 public constant REVIEW_PERIOD = 3 days;

    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => Bid[]) public jobBids;
    mapping(bytes32 => mapping(address => bool)) public hasBid;
    bytes32[] public allJobIds;

    modifier onlyResolver() {
        require(msg.sender == resolver, "Only resolver");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
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

    constructor(address _registryAddress, address token) Escrow(token) {
        registry = UserRegistry(_registryAddress);
        owner = msg.sender;
    }

    function setResolver(address _resolver) external onlyOwner {
        resolver = _resolver;
    }

    function createJob(
        string memory ipfsLink,
        uint256 budget,
        uint256 deadline
    ) external onlyClient {
        if (deadline <= block.timestamp) revert DeadlineMustBeInFuture();

        bytes32 jobId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, totalJobs)
        );

        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: address(0),
            budget: budget,
            deadline: deadline,
            status: JobStatus.Open,
            ipfs: ipfsLink,
            ipfsProof: "",
            createdAt: block.timestamp,
            submittedAt: 0,
            disputed: false
        });

        allJobIds.push(jobId);
        totalJobs++;

        emit JobCreated(jobId, msg.sender, budget, deadline, ipfsLink);
    }

    function submitBid(
        bytes32 jobId,
        uint256 bidAmount
    ) external onlyFreelancer onlyOpenJob(jobId) {
        if (bidAmount >= jobs[jobId].budget)
            revert AmountShouldBeGreaterThanOffer();
        if (jobs[jobId].deadline < block.timestamp)
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
        if (job.deadline < block.timestamp)
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
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;
        emit JobCompleted(jobId, job.freelancer);
    }

    function raiseDispute(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert OnlySubmittedJobs();
        if (job.disputed) revert DisputeAlreadyRaised();

        if (msg.sender != job.client && msg.sender != job.freelancer)
            revert NotJobParticipant();

        if (block.timestamp > job.submittedAt + REVIEW_PERIOD)
            revert DisputePeriodOver();

        job.status = JobStatus.Disputed;
        job.disputed = true;

        emit DisputeRaised(jobId, msg.sender);
    }

    function editJobDetails(
        bytes32 jobId,
        string memory ipfsLink,
        uint256 budget,
        uint256 deadline
    ) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (block.timestamp > job.deadline) revert CannotEditAfterExpiry();

        require(jobBids[jobId].length == 0, "Cannot edit with bids");

        if (job.status != JobStatus.Open) revert OnlyOpenJobs();
        if (deadline <= block.timestamp) revert DeadlineMustBeInFuture();

        job.budget = budget;
        job.deadline = deadline;
        job.ipfs = ipfsLink;

        emit JobDetailsUpdated(jobId, msg.sender, budget, deadline, ipfsLink);
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

        if (block.timestamp <= job.submittedAt + REVIEW_PERIOD)
            revert ReviewPeriodStillActive();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;

        emit JobCompleted(jobId, job.freelancer);
    }

    function resolveDispute(
        bytes32 jobId,
        address winner,
        uint256 payout
    ) external onlyResolver {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Not disputed");

        if (winner == job.freelancer) {
            _releaseFunds(jobId);
        } else if (winner == job.client) {
            _refundClient(jobId);
        } else {
            // _partialRelease(jobId, payout); // optional for partial payment
        }

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
