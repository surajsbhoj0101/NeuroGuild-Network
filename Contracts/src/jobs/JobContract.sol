// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UserRegistry} from "./interfaces/UserRegistry.sol";
import {Escrow} from "../escrow/Escrow.sol";
import {IReputationSBT} from "./interfaces/IReputation.sol";
import {
    ReentrancyGuard
} from "../../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract JobContract is Escrow, ReentrancyGuard {
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
    error ExpireDeadlineMustBeGreaterThanBid();
    error CannotEditAfterBids();
    error OnlySubmittedOrInProgressJobs();

    event DisputeRaised(bytes32 indexed jobId, address indexed by);
    event DisputeResolved(
        bytes32 indexed jobId,
        address winner
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

    event JobExpireDeadlineIncreased(
        bytes32 indexed jobId,
        uint256 exceedTimeBy
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

    event ClaimAfterExpiredDeadlineSuccessful(bytes32 indexed jobId);

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

    IReputationSBT public reputation;
    uint8 public reputationReward;
    uint8 public reputationPenalty;
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
    mapping(bytes32 => bool) public clientRatedFreelancer;
    mapping(bytes32 => bool) public freelancerRatedClient;

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
        uint8 initialReviewPeriod, // in days
        address _governance,
        uint8 initialReward,
        uint8 initialPenalty,
        address initialRepAddress
    ) Escrow(token) {
        registry = UserRegistry(_registryAddress);
        reviewPeriod = uint256(initialReviewPeriod) * 1 days; // store as seconds
        governance = _governance;
        reputationReward = initialReward;
        reputationPenalty = initialPenalty;
        reputation = IReputationSBT(initialRepAddress);
    }

    function setReviewPeriod(uint8 _reviewPeriod) external onlyGovernance {
        if (_reviewPeriod <= 1) revert ReviewPeroidMustBeGreaterThanOne(); // days
        reviewPeriod = uint256(_reviewPeriod) * 1 days;
    }

    function setReputationAddress(address _rep) external onlyGovernance {
        reputation = IReputationSBT(_rep);
    }

    function setGovernor(address _governance) external onlyGovernance {
        require(_governance != address(0), "Invalid governance address");
        governance = _governance;
    }

    function createJob(
        string memory ipfsLink,
        uint256 budget,
        uint256 bidDeadline,
        uint256 expireDeadline
    ) external onlyClient {
        if (bidDeadline >= expireDeadline)
            revert ExpireDeadlineMustBeGreaterThanBid();
        if (bidDeadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (budget <= 0) revert("Budget Should be greater than zero");

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

    function setRepReward(uint8 reward) external onlyGovernance {
        reputationReward = reward;
    }

    function setRepPenalty(uint8 penalty) external onlyGovernance {
        reputationPenalty = penalty;
    }

    function submitBid(
        bytes32 jobId,
        uint256 bidAmount
    ) external onlyFreelancer onlyOpenJob(jobId) {
        if (bidAmount <= jobs[jobId].budget)
            revert AmountShouldBeGreaterThanOffer();
        if (jobs[jobId].bidDeadline < block.timestamp)
            revert cannotSubmitBidDeadlineExceed();

        if (hasBid[jobId][msg.sender]) revert OnlyBidOnce();
        require(bidAmount > 0, "Bid Amount must be greater than zero");

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

    function acceptBid(
        bytes32 jobId,
        uint256 bidIndex
    ) external onlyClient nonReentrant {
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
        _lockFunds(jobId, chosenBid.amount, chosenBid.freelancer);
        emit JobStarted(jobId, chosenBid.freelancer);
    }

    function submitWork(
        bytes32 jobId,
        string memory ipfsProof
    ) external onlyFreelancer {
        Job storage job = jobs[jobId];
        if (job.expireDeadline < block.timestamp)
            revert cannotSubmitWorkDeadlineExceeded();
        if (bytes(job.ipfsProof).length != 0) revert WorkAlreadySubmitted();
        if (job.freelancer != msg.sender) revert NotAssignedFreelancer();
        if (job.status != JobStatus.InProgress) revert OnlyInProgressJobs();
        require(bytes(ipfsProof).length > 0, "Ipfs proof should not be null");
        job.ipfsProof = ipfsProof;
        job.submittedAt = block.timestamp;
        job.status = JobStatus.Submitted;

        emit WorkSubmitted(jobId, msg.sender, ipfsProof);
    }

    function acceptWork(bytes32 jobId) external onlyClient nonReentrant {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.Submitted) revert OnlySubmittedJobs();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;

        _changeRep(job.freelancer, reputationReward);
        _changeRep(job.client, reputationReward);

        emit JobCompleted(jobId, job.freelancer);
    }

    function increaseExpireDeadline(
        bytes32 jobId,
        uint256 exceedTimeBy
    ) external onlyClient {
        Job storage job = jobs[jobId];
        require(
            job.status == JobStatus.InProgress,
            "Job should be in progress"
        );
        require(exceedTimeBy < 30 days, "Cannot exceed time more than 30 days");
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
        uint256 bidDeadline,
        uint256 expireDeadline
    ) external onlyClient {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (block.timestamp > job.bidDeadline) revert CannotEditAfterExpiry();

        if (jobBids[jobId].length != 0) revert CannotEditAfterBids();

        if (job.status != JobStatus.Open) revert OnlyOpenJobs();
        if (bidDeadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (expireDeadline <= bidDeadline)
            revert("Expired deadline must be greater than bidDeadline");

        job.budget = budget;
        job.bidDeadline = bidDeadline;
        job.ipfs = ipfsLink;
        job.expireDeadline = expireDeadline;

        emit JobDetailsUpdated(
            jobId,
            msg.sender,
            budget,
            bidDeadline,
            expireDeadline, // pass the new value
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

    function claimAfterReviewPeriod(
        bytes32 jobId
    ) external onlyFreelancer nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted) revert OnlySubmittedJobs();
        if (job.disputed) revert DisputeAlreadyRaised();

        if (block.timestamp <= job.submittedAt + reviewPeriod)
            revert ReviewPeriodStillActive();

        _releaseFunds(jobId);
        job.status = JobStatus.Completed;

        emit JobCompleted(jobId, job.freelancer);
    }

    function claimAfterExpiredDeadline(
        bytes32 jobId
    ) external onlyClient nonReentrant {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.InProgress)
            revert("job status is not InProgress");
        if (job.expireDeadline > block.timestamp)
            revert("Job has not expired yet");

        job.status = JobStatus.Expired;
        _refundClient(jobId);
        _changeRep(job.freelancer, reputationPenalty);
        emit ClaimAfterExpiredDeadlineSuccessful(jobId);
    }

    function _changeRep(address user, uint256 amount) internal {
        if (address(reputation) == address(0)) return;
        uint256 tokenId = reputation.getTokenId(user);
        reputation.increaseScoreFromSystem(tokenId, amount);
    }

    function resolveDispute(
        bytes32 jobId,
        address winner
    ) external onlyGovernance nonReentrant {
        Job storage job = jobs[jobId];

        require(job.status == JobStatus.Disputed, "Not disputed");

        require(
            winner == job.client || winner == job.freelancer,
            "Invalid winner"
        );

        if (winner == job.freelancer) {
            _releaseFunds(jobId); // sends full escrow to freelancer

            _changeRep(job.freelancer, reputationReward);
            _changeRep(job.client, reputationPenalty);
        } else {
            _refundClient(jobId); // sends full escrow back to client

            _changeRep(job.client, reputationReward);
            _changeRep(job.freelancer, reputationPenalty);
        }

        job.status = JobStatus.Completed;

        emit DisputeResolved(jobId, winner);
    }

    function rateFreelancer(bytes32 jobId, uint8 rating) external onlyClient {
        Job storage job = jobs[jobId];

        if (job.client != msg.sender) revert NotJobClient();
        if (job.status != JobStatus.Completed) revert("Job not completed yet");
        if (clientRatedFreelancer[jobId]) revert("Already rated");
        if (rating > 10) revert("Rating must be <= 10");

        clientRatedFreelancer[jobId] = true;

        _changeRep(job.freelancer, rating);
    }

    function rateClient(bytes32 jobId, uint8 rating) external onlyFreelancer {
        Job storage job = jobs[jobId];

        if (job.freelancer != msg.sender) revert NotAssignedFreelancer();
        if (job.status != JobStatus.Completed) revert("Job not completed yet");
        if (freelancerRatedClient[jobId]) revert("Already rated");
        if (rating > 10) revert("Rating must be <= 10");

        freelancerRatedClient[jobId] = true;

        _changeRep(job.client, rating);
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
