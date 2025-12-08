// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    IERC721
} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {
    ERC721
} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ReputationSBT is ERC721URIStorage {
    // ------------------------------------------------------------
    // Events
    // ------------------------------------------------------------
    event ReputationMinted(address indexed user, uint256 tokenId);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore);
    event ReputationSlashed(uint256 indexed tokenId, uint256 newScore);
    event ReputationRevoked(uint256 indexed tokenId, string reason);

    event JobCompleted(uint256 indexed tokenId, uint32 completedJobs, uint16 reliabilityScore);
    event JobFailed(uint256 indexed tokenId, uint32 failedJobs, uint16 reliabilityScore);
    event DisputeRecorded(uint256 indexed tokenId, uint32 disputeCount, uint16 reliabilityScore);

    event RatingRecorded(uint256 indexed tokenId, uint16 newAverageRating, uint8 rating);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    
    struct Reputation {
        uint32 completedJobs;
        uint32 failedJobs;
        uint32 disputeCount;
        uint16 ratingAverage; // 0–100
        uint16 reliabilityScore; // 0–100
        uint256 totalScore;
        uint256 lastUpdated;
        string metadataURI;
        bool revoked;
    }

    mapping(uint256 => Reputation) public repData;
    mapping(address => uint256) public userToToken;

    uint256 private nextTokenId = 1;
    uint256 public constant MAX_REPUTATION = 1000;

    address public jobContract;
    address public governor;

    constructor(address _governor) ERC721("NeuroGuild Reputation", "NGREP") {
        governor = _governor;
    }

  
    modifier onlyJobContract() {
        require(msg.sender == jobContract, "Only JobContract can call this");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governor, "Only governance");
        _;
    }

   

    function setJobContract(address _jobContract) external onlyGovernance {
        require(_jobContract != address(0), "Invalid jobContract address");
        jobContract = _jobContract;
    }

    function setGovernor(address _governor) external onlyGovernance {
        require(_governor != address(0), "Invalid governor address");
        governor = _governor;
    }


    function mintReputation(
        address user,
        string memory metadataURI
    ) external onlyJobContract returns (uint256) {
        require(userToToken[user] == 0, "User already has Reputation SBT");

        uint256 tokenId = nextTokenId++;
        _safeMint(user, tokenId);
        _setTokenURI(tokenId, metadataURI);

        repData[tokenId] = Reputation({
            completedJobs: 0,
            failedJobs: 0,
            disputeCount: 0,
            ratingAverage: 0,
            reliabilityScore: 100,
            totalScore: 0,
            lastUpdated: block.timestamp,
            metadataURI: metadataURI,
            revoked: false
        });

        userToToken[user] = tokenId;

        emit ReputationMinted(user, tokenId);
        return tokenId;
    }

 

    function increaseScoreFromSystem(
        uint256 tokenId,
        uint256 amount
    ) external onlyJobContract {
        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");

        if (r.totalScore + amount > MAX_REPUTATION) {
            r.totalScore = MAX_REPUTATION;
        } else {
            r.totalScore += amount;
        }

        r.lastUpdated = block.timestamp;
        emit ReputationUpdated(tokenId, r.totalScore);
    }

    function decreaseScoreFromSystem(
        uint256 tokenId,
        uint256 amount
    ) external onlyJobContract {
        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");

        if (amount >= r.totalScore) {
            r.totalScore = 0;
        } else {
            r.totalScore -= amount;
        }

        r.lastUpdated = block.timestamp;
        emit ReputationSlashed(tokenId, r.totalScore);
    }

  
    function recordJobCompleted(uint256 tokenId) external onlyJobContract {
        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");

        r.completedJobs++;

        uint256 totalJobs = r.completedJobs + r.failedJobs;
        r.reliabilityScore = uint16((r.completedJobs * 100) / totalJobs);

        r.lastUpdated = block.timestamp;

        emit JobCompleted(tokenId, r.completedJobs, r.reliabilityScore);
    }

    function recordJobFailed(uint256 tokenId) external onlyJobContract {
        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");

        r.failedJobs++;

        uint256 totalJobs = r.completedJobs + r.failedJobs;
        r.reliabilityScore = uint16((r.completedJobs * 100) / totalJobs);

        r.lastUpdated = block.timestamp;

        emit JobFailed(tokenId, r.failedJobs, r.reliabilityScore);
    }

    function recordDispute(uint256 tokenId) external onlyJobContract {
        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");

        r.disputeCount++;

        if (r.reliabilityScore > 10) {
            r.reliabilityScore -= 10;
        } else {
            r.reliabilityScore = 0;
        }

        r.lastUpdated = block.timestamp;

        emit DisputeRecorded(tokenId, r.disputeCount, r.reliabilityScore);
    }



    function recordRating(uint256 tokenId, uint8 rating) external onlyJobContract {
        require(rating <= 10, "Rating must be 0 to 10");

        Reputation storage r = repData[tokenId];
        require(!r.revoked, "Reputation revoked");
        require(r.completedJobs > 0, "No completed job to rate");

        uint256 previousCompleted = r.completedJobs;

        // Weighted average: (oldAvg * (n-1) + rating) / n
        r.ratingAverage = uint16(
            (uint256(r.ratingAverage) * (previousCompleted - 1) + rating)
                / previousCompleted
        );

        r.lastUpdated = block.timestamp;

        emit RatingRecorded(tokenId, r.ratingAverage, rating);
    }

    // ------------------------------------------------------------
    // Metadata Update
    // ------------------------------------------------------------

    function setMetadataURI(
        uint256 tokenId,
        string memory newURI
    ) external onlyJobContract {
        _setTokenURI(tokenId, newURI);
        repData[tokenId].metadataURI = newURI;

        emit MetadataUpdated(tokenId, newURI);
    }

   

    function revokeReputation(
        uint256 tokenId,
        string calldata reason
    ) external onlyGovernance {
        repData[tokenId].revoked = true;
        emit ReputationRevoked(tokenId, reason);
    }


    function transferFrom(address, address, uint256)
        public
        pure
        override(ERC721, IERC721)
    {
        revert("ReputationSBT: Transfers disabled");
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("ReputationSBT: Approvals disabled");
    }

    function setApprovalForAll(address, bool)
        public
        pure
        override(ERC721, IERC721)
    {
        revert("ReputationSBT: Approvals disabled");
    }
}
