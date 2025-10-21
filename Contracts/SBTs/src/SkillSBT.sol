// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721SBT} from "./ERC721SBT/ERC721SBT.sol";

contract SkillSBT is ERC721SBT {
    uint256 private _currentTokenId; // auto-increment token IDs

    constructor(
        address _admin
    ) ERC721SBT(_admin) {}

    function mint(
        string memory uri, string memory skillName
    ) external onlyWhiteListed returns (uint256) {
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;
        _mint(msg.sender, newTokenId);
        _updateSkill(skillName);
        _setTokenUri(newTokenId, uri);
        return newTokenId;
    }

    function updateSkill(string memory skillName) external onlyWhiteListed{
        _updateSkill(skillName);
    }

    function tokenUri(uint256 id) external view returns (string memory) {
        return _tokenUri[id];
    }
}
