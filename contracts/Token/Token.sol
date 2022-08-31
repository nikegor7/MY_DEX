// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC_20.sol";

contract Token is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        mint(msg.sender, initialSupply);
    }
}