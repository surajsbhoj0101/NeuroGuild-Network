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

    // Here, the contractOwner becomes the address that deployed the contract, i.e., msg.sender at deployment.
    function testOwner() public view {
        assertEq(msg.sender, mySkillSbt.admin());
    }

    // When you call deploySkillSbt.run(), the contract is deployed by the DeploySkillSBT script, so in Solidity terms, msg.sender inside the SkillSBT constructor is the script contract, not your test contract or the test’s msg.sender.
    function testMint() public {
        vm.prank(mySkillSbt.admin()); // impersonate admin
        mySkillSbt.addToWhitelist(address(this));

        uint tokenId = mySkillSbt.mint(address(this), uri);
        string memory storedUri = mySkillSbt.tokenUri(tokenId);
        assertEq(uri, storedUri);

        uint balance = mySkillSbt.balanceOf(address(this));
        assertEq(balance, 1);
    }
}
