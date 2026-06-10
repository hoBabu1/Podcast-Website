// Base Sepolia testnet USDC — switch to 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 for mainnet
// Address is set via NEXT_PUBLIC_USDC_ADDRESS in .env.local
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '') as `0x${string}`

export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
