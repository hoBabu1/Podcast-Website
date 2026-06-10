// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract DeployMockUSDT is Script {
    // Recipient to fund immediately after deployment.
    address constant RECIPIENT = 0x096DD3EBFab85c85309477DDf3A18FC31ecBa33a;
    // 10000000000000000e18 = 1e34 base units (10 quadrillion whole USDT at 18 decimals).
    uint256 constant MINT_AMOUNT = 10000000000000000e18;

    function run() external returns (MockUSDT token) {
        vm.startBroadcast();
        token = new MockUSDT();
        token.mint(RECIPIENT, MINT_AMOUNT);
        vm.stopBroadcast();

        console.log("MockUSDT deployed at:", address(token));
        console.log("Name:    ", token.name());
        console.log("Symbol:  ", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("Minted to:", RECIPIENT);
        console.log("Balance:  ", token.balanceOf(RECIPIENT));
    }
}
