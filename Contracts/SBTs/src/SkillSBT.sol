// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721SBT} from "./ERC721SBT/ERC721SBT.sol";

contract SkillSBT is ERC721SBT {
    uint256 private _currentTokenId; // auto-increment token IDs

    constructor() ERC721SBT(msg.sender) {}

    /// @notice Admin or contract can mint SBT to a user
    function mint(
        address to,
        string memory uri
    ) external onlyWhiteListed returns (uint256) {
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        _mint(to, newTokenId);
        _setTokenUri(newTokenId, uri);
        return newTokenId;
    }

    function tokenUri(uint256 id) external view returns (string memory) {
        return _tokenUri[id];
    }

    
}
