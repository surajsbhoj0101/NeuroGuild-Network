// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IReputationSBT {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function ownerOf(uint256 tokenId) external view returns (address);

    function balanceOf(address owner) external view returns (uint256);

    function tokenURI(uint256 tokenId) external view returns (string memory);

    function getTokenId(address user) external view returns (uint256);

    function reputationScore(uint256 tokenId) external view returns (uint256);

    function authorizedContracts(address contractAddr) external view returns (bool);

    function admin() external view returns (address);

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

   
    
    function addAuthorized(address contractAddr) external;

    function removeAuthorized(address contractAddr) external;

    function setAdmin(address newAdmin) external;

    function mintFromSystem(address user, string calldata tokenUri)
        external
        returns (uint256);

    function increaseScoreFromSystem(uint256 tokenId, uint256 amount) external;

    function decreaseScoreFromSystem(uint256 tokenId, uint256 amount) external;

    function setScoreFromSystem(uint256 tokenId, uint256 newScore) external;

    function adminSetTokenURI(uint256 tokenId, string calldata uri) external;
}
