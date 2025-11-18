// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "./interfaces/IERC721.sol";
import {IERC165} from "./interfaces/IERC165.sol";
import {IERC721Metadata} from "./interfaces/IERC721Metadata.sol";

contract ReputationSBT is IERC721, IERC721Metadata {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed id
    );
    event TokenURISet(uint256 indexed tokenId, string uri);
    event ReputationIncreased(uint256 indexed tokenId, uint256 newScore);
    event ReputationDecreased(uint256 indexed tokenId, uint256 newScore);
    event ReputationSet(uint256 indexed tokenId, uint256 newScore);
    event AuthorizedAdded(address indexed who);
    event AuthorizedRemoved(address indexed who);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    string public constant name = "NeuroGuild Soul Reputation";
    string public constant symbol = "NGSR";

    uint256 private _currentTokenId;

    mapping(uint256 => string) internal _tokenUri;
    mapping(uint256 => address) internal _ownerOf;
    mapping(address => uint256) internal _tokenIdOf;
    mapping(address => uint256) internal _balanceOf;
    mapping(uint256 => uint256) public reputationScore;
    mapping(address => bool) public authorizedContracts;

    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addAuthorized(address contractAddr) external onlyAdmin {
        require(contractAddr != address(0), "zero address");
        authorizedContracts[contractAddr] = true;
        emit AuthorizedAdded(contractAddr);
    }

    function removeAuthorized(address contractAddr) external onlyAdmin {
        authorizedContracts[contractAddr] = false;
        emit AuthorizedRemoved(contractAddr);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "zero address");
        address old = admin;
        admin = newAdmin;
        emit AdminChanged(old, newAdmin);
    }

    function  getScore(uint256 tokenId) public view returns(uint256){
        return reputationScore[tokenId];
    }

    function mintFromSystem(
        address user,
        string calldata tokenUri
    ) external returns(uint256) {
        require(user != address(0), "zero address");
        require(_balanceOf[user] == 0, "already owns SBT");

        _currentTokenId++;
        uint256 newId = _currentTokenId;

        _mint(user, newId);
        _tokenIdOf[user] = newId;
        reputationScore[newId] = 0;
        _setTokenUri(newId, tokenUri);

        return newId;
    }

    function increaseScoreFromSystem(
        uint256 tokenId,
        uint256 amount
    ) external onlyAuthorized {
        _increaseScore(tokenId, amount);
    }

    function decreaseScoreFromSystem(
        uint256 tokenId,
        uint256 amount
    ) external onlyAuthorized {
        _decreaseScore(tokenId, amount);
    }

    

    function adminSetTokenURI(
        uint256 tokenId,
        string calldata uri
    ) external onlyAdmin {
        require(_exists(tokenId), "token doesn't exist");
        _setTokenUri(tokenId, uri);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _ownerOf[tokenId];
        require(owner != address(0), "token doesn't exist");
        return owner;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "zero address");
        return _balanceOf[owner];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "token doesn't exist");
        return _tokenUri[tokenId];
    }

    function getTokenId(address user) external view returns (uint256) {
        require(_tokenIdOf[user] != 0, "user has no SBT");
        return _tokenIdOf[user];
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "zero address");
        require(_ownerOf[tokenId] == address(0), "already minted");

        _ownerOf[tokenId] = to;
        _balanceOf[to] = 1;

        emit Transfer(address(0), to, tokenId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf[tokenId] != address(0);
    }

    function _increaseScore(uint256 tokenId, uint256 amount) internal {
        require(_exists(tokenId), "token doesn't exist");
        reputationScore[tokenId] += amount;
        emit ReputationIncreased(tokenId, reputationScore[tokenId]);
    }

    function _decreaseScore(uint256 tokenId, uint256 amount) internal {
        require(_exists(tokenId), "token doesn't exist");
        require(reputationScore[tokenId] >= amount, "score below zero");
        reputationScore[tokenId] -= amount;
        emit ReputationDecreased(tokenId, reputationScore[tokenId]);
    }

    function _setTokenUri(uint256 tokenId, string memory uri) internal {
        _tokenUri[tokenId] = uri;
        emit TokenURISet(tokenId, uri);
    }
}
