// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract MockUSDTTest is Test {
    MockUSDT token;

    function setUp() public {
        token = new MockUSDT();
    }

    function test_Metadata() public view {
        assertEq(token.name(), "Mock Tether USD");
        assertEq(token.symbol(), "USDT");
        assertEq(token.decimals(), 18);
    }

    function test_AnyoneCanMint() public {
        address alice = makeAddr("alice");
        vm.prank(alice);
        token.mint(alice, 1_000e18);
        assertEq(token.balanceOf(alice), 1_000e18);
    }

    function testFuzz_MintAnyAmount(address to, uint256 amount) public {
        vm.assume(to != address(0));
        token.mint(to, amount);
        assertEq(token.balanceOf(to), amount);
    }
}
