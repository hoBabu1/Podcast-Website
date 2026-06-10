// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT
/// @notice A mock USDT token for testing. 18 decimals. Anyone can mint any amount.
/// @dev FOR TESTING ONLY — open, unlimited minting makes this unsafe for production.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "USDT") {}

    /// @notice Mint `amount` tokens 
    to `to`. Open to anyone, no cap.
    /// @param to The address that receives the minted tokens.
    /// @param amount The amount to mint (in wei units, 18 decimals).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Override decimals to 18 (real USDT uses 6; this mock uses 18 by request).
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
