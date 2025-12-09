// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IReputationSBT {
    event ReputationMinted(address indexed user, uint256 tokenId);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newScore);
    event ReputationSlashed(uint256 indexed tokenId, uint256 newScore);
    event ReputationRevoked(uint256 indexed tokenId, string reason);

    event JobCompleted(
        uint256 indexed tokenId,
        uint32 completedJobs,
        uint16 reliabilityScore
    );
    event JobFailed(
        uint256 indexed tokenId,
        uint32 failedJobs,
        uint16 reliabilityScore
    );
    event DisputeRecorded(
        uint256 indexed tokenId,
        uint32 disputeCount,
        uint16 reliabilityScore
    );

    event RatingRecorded(
        uint256 indexed tokenId,
        uint16 newAverageRating,
        uint8 rating
    );
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    struct Reputation {
        uint32 completedJobs;
        uint32 failedJobs;
        uint32 disputeCount;
        uint16 ratingAverage;
        uint16 reliabilityScore;
        uint256 totalScore;
        uint256 lastUpdated;
        string metadataURI;
        bool revoked;
    }

    function repData(
        uint256 tokenId
    )
        external
        view
        returns (
            uint32 completedJobs,
            uint32 failedJobs,
            uint32 disputeCount,
            uint16 ratingAverage,
            uint16 reliabilityScore,
            uint256 totalScore,
            uint256 lastUpdated,
            string memory metadataURI,
            bool revoked
        );

    function userToToken(address user) external view returns (uint256);

    function getTokenId(address user) external view returns (uint256);

    function jobContract() external view returns (address);
    function governor() external view returns (address);

    function MAX_REPUTATION() external view returns (uint256);

    function setJobContract(address _jobContract) external;

    function setGovernor(address _governor) external;

    function mintReputation(
        address user,
        string memory metadataURI
    ) external returns (uint256);

    function increaseScoreFromSystem(uint256 tokenId, uint256 amount) external;

    function decreaseScoreFromSystem(uint256 tokenId, uint256 amount) external;

    function recordJobCompleted(uint256 tokenId) external;

    function recordJobFailed(uint256 tokenId) external;

    function recordDispute(uint256 tokenId) external;

    function recordRating(uint256 tokenId, uint8 rating) external;

    function setMetadataUri(uint256 tokenId, string calldata newUri) external;

    function revokeReputation(uint256 tokenId, string calldata reason) external;
}
