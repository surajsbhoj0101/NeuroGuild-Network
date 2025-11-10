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

    enum JobStatus {
        Open,
        InProgress,
        Completed,
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
    }

    struct Bid {
        bytes32 jobId;
        address freelancer;
        uint256 amount;
        uint256 createdAt;
    }

    UserRegistry public registry;
    uint256 public totalJobs;

    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => Bid[]) public jobBids;
    mapping(bytes32 => mapping(address => bool)) public hasBid;
    bytes32[] public allJobIds;

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
            createdAt: block.timestamp
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
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.Open) revert OnlyOpenJobs();

        Bid[] storage bids = jobBids[jobId];
        if (bidIndex >= bids.length) revert InvalidBidIndex();

        Bid storage chosenBid = bids[bidIndex];

        _lockFunds(jobId, chosenBid.amount, chosenBid.freelancer);
        job.status = JobStatus.InProgress;
        job.freelancer = chosenBid.freelancer;
        emit JobStarted(jobId, chosenBid.freelancer);
    }

    function submitWork(
        bytes32 jobId,
        string memory ipfsProof
    ) external onlyFreelancer {
        Job storage job = jobs[jobId];
        if (job.freelancer != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();

        job.ipfsProof = ipfsProof;
    }

    function jobCompletion(bytes32 jobId) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;
        emit JobCompleted(jobId, job.freelancer);
    }

    function raiseIssue(bytes32 jobId) external onlyClient {
        //do later
    }

    function editJobDetails(
        bytes32 jobId,
        string memory ipfsLink,
        uint256 budget,
        uint256 deadline
    ) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        require(jobBids[jobId].length == 0, "Cannot edit with bids");

        if (job.status != JobStatus.Open) revert OnlyOpenJobs();
        if (deadline <= block.timestamp) revert DeadlineMustBeInFuture();

        job.budget = budget;
        job.deadline = deadline;
        job.ipfs = ipfsLink;

        emit JobDetailsUpdated(jobId, msg.sender, budget, deadline, ipfsLink);
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
