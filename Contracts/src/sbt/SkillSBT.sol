// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "./interfaces/IERC721.sol";
import {IERC165} from "./interfaces/IERC165.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";


/// @title ERC721 SBT with mutable token URI and admin-only skill updates
contract SkillSBT is IERC721, IERC721Metadata {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed id
    );

    event SkillUpdated(
        address indexed userAddr,
        string indexed skillName,
        uint8 indexed level
    );

    event TokenURISet(uint256 indexed tokenId, string uri);
    event AddedToWhitelist(address indexed userAddr);

    address public admin;
    uint8 public constant MAX_LEVEL = 1;
    string public constant name = "NeruroGuild SkillSBT";
    string public constant symbol = "NG-SBT";
 

    uint256 private _currentTokenId;

    mapping(address => mapping(bytes32 => uint8)) public _skillLevels;
    mapping(address => bool) internal _whiteList;
    mapping(uint256 => string) internal _tokenUri;
    mapping(uint256 => address) internal _ownerOf;
    mapping(address => uint8) internal _balanceOf;

    modifier onlyAdmin() {
        require(msg.sender == admin, "you are not admin");
        _;
    }

    modifier onlyWhiteListed() {
        require(_whiteList[msg.sender], "not whitelisted");
        _;
    }

    constructor(address _admin_) {
        require(_admin_ != address(0), "admin = zero address");
        admin = _admin_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    function ownerOf(uint256 id) external view returns (address owner) {
        owner = _ownerOf[id];
        require(owner != address(0), "token doesn't exist");
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "owner = zero address");
        return _balanceOf[owner];
    }

    function isWhiteListed(address userAddr) external view returns (bool) {
        return _whiteList[userAddr];
    }

    function skillLevels(
        string memory skillName,
        address userAddr
    ) external view returns (uint8) {
        require(_balanceOf[userAddr] > 0, "mint SBT first");
        bytes32 skillKey = keccak256(abi.encodePacked(skillName));
        return _skillLevels[userAddr][skillKey];
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return _tokenUri[id];
    }

    function tokenIdOf(address user) external view returns (uint256) {
        require(_balanceOf[user] > 0, "user has no SBT");
        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (_ownerOf[i] == user) {
                return i;
            }
        }
        revert("token not found");
    }

    function addToWhitelist(address userAddr) external onlyAdmin {
        _whiteList[userAddr] = true;
        emit AddedToWhitelist(userAddr);
    }

    function updateSkill(
        string memory skillName,
        address userAddr,
        string memory tokenUri_
    ) external onlyAdmin {
        uint256 tokenId = _getTokenId(userAddr);
        _updateSkill(skillName, userAddr, tokenId, tokenUri_);
    }

    function mint() external onlyWhiteListed returns (uint256) {
        require(_balanceOf[msg.sender] == 0, "already has SBT");
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        _mint(msg.sender, newTokenId);
        return newTokenId;
    }

    function _getTokenId(address user) internal view returns (uint256) {
        require(_balanceOf[user] > 0, "user has no SBT");
        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (_ownerOf[i] == user) {
                return i;
            }
        }
        revert("token not found");
    }

    function _updateSkill(
        string memory skillName,
        address userAddr,
        uint256 tokenId,
        string memory uri
    ) internal {
        require(_balanceOf[userAddr] > 0, "mint SBT first");
        bytes32 skillKey = keccak256(abi.encodePacked(skillName));
        uint8 currentLevel = _skillLevels[userAddr][skillKey];
        require(currentLevel < MAX_LEVEL, "max level reached");

        _skillLevels[userAddr][skillKey] = currentLevel + 1;
        _setTokenUri(tokenId, uri);

        emit SkillUpdated(userAddr, skillName, currentLevel + 1);
    }

    function _mint(address to, uint256 id) internal {
        require(to != address(0), "mint to zero address");
        require(_ownerOf[id] == address(0), "token already minted");

        _balanceOf[to] = 1;
        _ownerOf[id] = to;

        emit Transfer(address(0), to, id);
    }

    function _setTokenUri(uint256 id, string memory uri) internal {
        _tokenUri[id] = uri;
        emit TokenURISet(id, uri);
    }
}
