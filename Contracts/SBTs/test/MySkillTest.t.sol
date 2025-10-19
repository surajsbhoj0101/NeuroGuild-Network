// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DeploySkillSBT} from "../script/DeploySkillSBT.s.sol";
import {SkillSBT} from "../src/SkillSBT.sol";

contract MySkillTest is Test {
    SkillSBT mySkillSbt;
    DeploySkillSBT deploySkillSbt;
    address alice = address(1);
    string uri = "3234324224";

    function setUp() external {
        deploySkillSbt = new DeploySkillSBT();
        mySkillSbt = deploySkillSbt.run(); // call the script’s run() to deploy the contract
    }

    // deployed the contract via the script using msg.sender as the test contract’s address.
    function testOwner() public view {
        assertEq(address(this), mySkillSbt.admin());
    }

    function testName() public view {
        assertEq("Solidity SBT", mySkillSbt.skillName());
    }

    function testMint() public {
        mySkillSbt.addToWhitelist(address(this));

        uint tokenId = mySkillSbt.mint(address(this), uri);

        string memory storedUri = mySkillSbt.tokenUri(tokenId);
        assertEq(uri, storedUri);

        uint balance = mySkillSbt.balanceOf(address(this));
        assertEq(balance, 1);
    }

    function test_RevertIfMintNotWhitelisted() public {
        vm.expectRevert("not whitelisted");
        mySkillSbt.mint(address(this), "uri");
    }

    function testMintWithPrank() public {
        address bob = address(2);

       
        vm.prank(mySkillSbt.admin());
        mySkillSbt.addToWhitelist(bob);

        vm.prank(bob);
        uint tokenId = mySkillSbt.mint(bob, "skillURI");

        assertEq(mySkillSbt.balanceOf(bob), 1);
    }
}
