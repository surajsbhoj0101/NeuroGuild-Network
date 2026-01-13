// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {ICouncilRegistry} from "./interfaces/ICouncilRegistry.sol";

contract SkillSBT is ERC721URIStorage {
    error InvalidRole();
    error AlreadyHasSkill();
    error NotCouncil();
    error MaxAiScoreReached();
    error MaxCouncilScoreReached();
    error LevelNotImproved();
    error SkillDoesNotExist();

    event SkillUpgraded(
        uint256 tokenId,
        SkillLevel oldLevel,
        SkillLevel newLevel
    );
    event SkillMinted(
        uint256 indexed tokenId,
        address indexed user,
        bytes32 indexed skillId,
        uint8 aiScore,
        uint8 councilConfidence,
        SkillLevel level,
        string metadataURI
    );

    enum SkillLevel {
        Beginner,
        Intermediate,
        Advance
    }

    struct SkillData {
        bytes32 skillId;
        uint8 aiScore;
        uint8 councilConfidence;
        SkillLevel level;
        uint256 issuedAt;
        address reviewer;
        string metadataURI;
    }

    mapping(uint256 => SkillData) public skillData;
    mapping(address => uint256[]) public userSkills;
    mapping(address => mapping(bytes32 => bool)) public hasSkill;

    address public timelock;
    ICouncilRegistry public councilRegistry;

    uint256 private nextTokenId = 1;

    constructor(
        address _timelock,
        address _councilRegistry
    ) ERC721("NeuroGuild Skill SBT", "NGSBT") {
        timelock = _timelock;
        councilRegistry = ICouncilRegistry(_councilRegistry);
    }

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert InvalidRole();
        _;
    }

    modifier onlyCouncil() {
        if (!councilRegistry.isCouncil(msg.sender)) revert NotCouncil();
        _;
    }

    function updateCouncilRegistry(address newRegistry) external onlyTimelock {
        councilRegistry = ICouncilRegistry(newRegistry);
    }

    function mintSkill(
        address user,
        bytes32 skillId,
        uint8 aiScore,
        uint8 councilConfidence,
        string memory metadataURI
    ) external onlyCouncil {
        if (hasSkill[user][skillId]) revert AlreadyHasSkill();
        if (aiScore > 100) revert MaxAiScoreReached();
        if (councilConfidence > 100) revert MaxCouncilScoreReached();

        SkillLevel level = _calculateLevel(aiScore, councilConfidence);

        uint256 tokenId = nextTokenId++;
        _safeMint(user, tokenId);
        _setTokenURI(tokenId, metadataURI);

        skillData[tokenId] = SkillData({
            skillId: skillId,
            aiScore: aiScore,
            councilConfidence: councilConfidence,
            level: level,
            issuedAt: block.timestamp,
            reviewer: msg.sender,
            metadataURI: metadataURI
        });

        userSkills[user].push(tokenId);
        hasSkill[user][skillId] = true;

        emit SkillMinted(
            tokenId,
            user,
            skillId,
            aiScore,
            councilConfidence,
            level,
            metadataURI
        );
    }

    function upgradeSkill(
        uint256 tokenId,
        uint8 newAiScore,
        uint8 newCouncilConfidence
    ) external onlyCouncil {
        if (_ownerOf(tokenId) == address(0)) revert SkillDoesNotExist();
        if (newAiScore > 100) revert MaxAiScoreReached();
        if (newCouncilConfidence > 100) revert MaxCouncilScoreReached();

        SkillData storage skill = skillData[tokenId];

        SkillLevel oldLevel = skill.level;

        SkillLevel newLevel = _calculateLevel(newAiScore, newCouncilConfidence);

        if (newLevel <= oldLevel) revert LevelNotImproved();

        skill.aiScore = newAiScore;
        skill.councilConfidence = newCouncilConfidence;
        skill.level = newLevel;
        skill.issuedAt = block.timestamp;
        skill.reviewer = msg.sender;

        emit SkillUpgraded(tokenId, oldLevel, newLevel);
    }

    function _calculateLevel(
        uint8 aiScore,
        uint8 councilConfidence
    ) internal pure returns (SkillLevel) {
        uint16 total = uint16(aiScore) + uint16(councilConfidence);

        if (total <= 80) {
            return SkillLevel.Beginner;
        } else if (total <= 160) {
            return SkillLevel.Intermediate;
        } else {
            return SkillLevel.Advance;
        }
    }

    //  Overrides
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public pure override(ERC721, IERC721) {
        revert("SkillSBT: Transfers are disabled");
    }

    function approve(
        address to,
        uint256 tokenId
    ) public pure override(ERC721, IERC721) {
        revert("SkillSBT: Approvals are disabled");
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public pure override(ERC721, IERC721) {
        revert("SkillSBT: Approvals are disabled");
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && from != to) {
            revert("SkillSBT: Transfers are disabled");
        }
        return super._update(to, tokenId, auth);
    }
}
