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
    event SBTRevoked(address indexed user, uint256 indexed tokenId);

    address public contractOwner;

    mapping(uint256 => address) internal _ownerOf;

    mapping(address => uint256) internal _balanceOf;

    constructor(address _contractOwner) {
        require(_contractOwner != address(0), "owner = zero address");
        contractOwner = _contractOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "only owner can do this");
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

    function adminRevoke(uint256 tokenId) public onlyOwner {
        address tokenOwner = _ownerOf[tokenId];
        require(tokenOwner != address(0), "token does not exist");

        _burn(tokenId);
        emit SBTRevoked(tokenOwner, tokenId);
    }

    function _mint(address to, uint256 id) internal {
        require(to != address(0), "mint to zero address");
        require(_balanceOf[to] == 0, "user already has an SBT");
        require(_ownerOf[id] == address(0), "token already minted");

        _balanceOf[to] = 1;
        _ownerOf[id] = to;

        emit Transfer(address(0), to, id);
    }

    function _burn(uint256 id) internal {
        address owner = _ownerOf[id];
        require(owner != address(0), "token not minted");

        _balanceOf[owner] = 0;
        delete _ownerOf[id];

        emit Transfer(owner, address(0), id);
    }
}
