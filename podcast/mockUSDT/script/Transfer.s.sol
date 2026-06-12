// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Transfers 1000 USDT (18 decimals) from the broadcasting wallet to RECIPIENT.
contract TransferMockUSDT is Script {
    // Deployed MockUSDT contract.
    address constant TOKEN = 0xDE684eeC61BB7676f93ab2823959Fc9A1240F18B;
    // Destination wallet.
    address constant RECIPIENT = 0xbb55140ddB7565906F4cb295e3257cf7C363FAD2;
    // 1000 whole tokens at 18 decimals.
    uint256 constant AMOUNT = 1000e18;

    function run() external {
        IERC20 token = IERC20(TOKEN);

        vm.startBroadcast();
        bool ok = token.transfer(RECIPIENT, AMOUNT);
        require(ok, "transfer failed");
        vm.stopBroadcast();

        console.log("Transferred to:    ", RECIPIENT);
        console.log("Amount (base):     ", AMOUNT);
        console.log("Recipient balance: ", token.balanceOf(RECIPIENT));
    }
}
