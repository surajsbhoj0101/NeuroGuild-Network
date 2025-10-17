// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721SBT} from "./ERC721SBT/ERC721SBT.sol";

contract SkillSBT is ERC721SBT {
    uint256 private _currentTokenId; // auto-increment token IDs

    constructor(address owner) ERC721SBT(owner) {}

    /// @notice Admin or contract can mint SBT to a user
    function mint(address to) external onlyOwner returns (uint256) {
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        _mint(to, newTokenId);
        return newTokenId;
    }

    /// @notice Users can burn their own SBT
    function burn(uint256 id) external {
        require(msg.sender == _ownerOf[id], "SkillSBT: not owner");
        _burn(id);
    }
}
