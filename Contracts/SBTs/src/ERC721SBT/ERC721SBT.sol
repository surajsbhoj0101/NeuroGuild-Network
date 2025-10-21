// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "../interfaces/IERC721.sol";
import {IERC165} from "../interfaces/IERC165.sol";

contract ERC721SBT is IERC721 {
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
    event addedToWhitelist(address indexed userAddr);

    address public admin;

    uint8 public constant MAX_LEVEL = 2;

    mapping(address => mapping(bytes32 => uint8)) public _skillLevels;

    mapping(address => bool) internal _whiteList;

    mapping(uint256 => string) internal _tokenUri;

    mapping(uint256 => address) internal _ownerOf;

    mapping(address => uint8) internal _balanceOf;

    constructor(address _admin) {
        require(_admin != address(0), "verifier = zero address");
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "you are not admin");
        _;
    }

    modifier onlyWhiteListed() {
        require(_whiteList[msg.sender], "not whitelisted");
        _;
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

    function addToWhitelist(address userAddr) external onlyAdmin {
        _whiteList[userAddr] = true;
        emit addedToWhitelist(userAddr);
    }

    function skillLevels(
        string memory skillName
    ) external view returns (uint8) {
        require(_balanceOf[msg.sender] > 0, "mint SBT first");
        bytes32 skillKey = keccak256(abi.encodePacked(skillName));
        return _skillLevels[msg.sender][skillKey];
    }

    function _updateSkill(string memory skillName) internal onlyWhiteListed {
        require(_balanceOf[msg.sender] > 0, "mint SBT first");
        bytes32 skillKey = keccak256(abi.encodePacked(skillName));
        uint8 currentLevel = _skillLevels[msg.sender][skillKey];
        require(currentLevel < MAX_LEVEL, "Max level reached");

        _skillLevels[msg.sender][skillKey] = currentLevel + 1;
        emit SkillUpdated(msg.sender, skillName, currentLevel + 1);
    }

    function _mint(address to, uint256 id) internal {
        require(to != address(0), "mint to zero address");
        require(_balanceOf[to] == 0, "user already has an SBT");
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
