// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {
    ERC20
} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract ERC20Usdc is ERC20 {
    constructor() ERC20("US Dollar", "USD") {
        _mint(msg.sender, 100000);
    }
}
