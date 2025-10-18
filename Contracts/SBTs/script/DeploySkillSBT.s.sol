// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {Script} from "forge-std/Script.sol";
import {SkillSBT} from "../src/SkillSBT.sol";

contract DeploySkillSBT is Script {
    function run() external returns (SkillSBT) {
        SkillSBT skillSbt;
        vm.startBroadcast();
        skillSbt = new SkillSBT();
        vm.stopBroadcast();
        return skillSbt;
    }
}