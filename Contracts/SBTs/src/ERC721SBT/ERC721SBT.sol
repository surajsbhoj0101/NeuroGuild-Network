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

    event TokenURISet(uint256 indexed tokenId, string uri);
    event addedToWhitelist(address indexed userAddr);

    address public admin;

    string public skillName;

    string public skillSymbol;

    mapping(address => bool) internal _whiteList;

    mapping(uint256 => string) internal _tokenUri;

    mapping(uint256 => address) internal _ownerOf;

    mapping(address => uint8) internal _balanceOf;

    constructor(address _admin, string memory _name, string memory _symbol) {
        require(_admin != address(0), "verifier = zero address");
        admin = _admin;
        skillName = _name;
        skillSymbol = _symbol;
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
