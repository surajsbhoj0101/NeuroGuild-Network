// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {
    ERC721
} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {
    Ownable
} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {ICouncilRegistry} from "./interfaces/ICouncilRegistry.sol";

contract SkillSBT is ERC721URIStorage {
    error InvalidRole();
    error AlreadyHasSkill();
    error NotCouncil();

    event SkillMinted(
        uint256 indexed tokenId,
        address indexed user,
        bytes32 indexed skillId,
        uint8 aiScore,
        uint8 councilConfidence,
        string level,
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

   
    address public governor;
    ICouncilRegistry public councilRegistry;

    uint256 private nextTokenId = 1;


    constructor(address _governor,address _councilRegistry) ERC721("NeuroGuild Skill SBT", "NGSBT") {
        governor = _governor;
        councilRegistry = ICouncilRegistry(_councilRegistry);
    }

    modifier onlyGovernance() {
        if (msg.sender != governor) revert InvalidRole();
        _;
    }

    modifier onlyCouncil() {
        if (!councilRegistry.isCouncil(msg.sender)) revert NotCouncil();
        _;
    }
    
    function mintSkill(
        address user,
        bytes32 skillId,
        uint8 aiScore,
        uint8 councilConfidence,
        SkillLevel level,
        string memory metadataURI
    ) external onlyCouncil {
        if (hasSkill[user][skillId]) revert AlreadyHasSkill();

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
            _levelToString(level),
            metadataURI
        );
    }

    function _levelToString(
        SkillLevel level
    ) internal pure returns (string memory) {
        if (level == SkillLevel.Beginner) return "Beginner";
        if (level == SkillLevel.Intermediate) return "Intermediate";
        return "Advance";
    }

    

    //  Overrides
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        revert("SkillSBT: Transfers are disabled");
    }

    function approve(address to, uint256 tokenId) public override(ERC721, IERC721) {
        revert("SkillSBT: Approvals are disabled");
    }

    function setApprovalForAll(address operator, bool approved)
        public
        override(ERC721, IERC721)
    {
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
