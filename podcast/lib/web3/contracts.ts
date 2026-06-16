export type SupportedToken = 'USDC' | 'USDT'

export const SUPPORTED_TOKENS: Record<
  SupportedToken,
  { symbol: SupportedToken; address: string; decimals: number; label: string }
> = {
  USDC: {
    symbol: 'USDC',
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
    decimals: Number(process.env.NEXT_PUBLIC_USDC_DECIMALS ?? 18),
    label: 'USDC',
  },
  USDT: {
    symbol: 'USDT',
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS!,
    decimals: Number(process.env.NEXT_PUBLIC_USDT_DECIMALS ?? 18),
    label: 'USDT',
  },
}

// Generic ERC20 transfer ABI — works for both USDC and USDT
export const ERC20_ABI = [
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
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// Backward-compatibility aliases — existing imports of USDC_ADDRESS / USDC_ABI still compile
// Base mainnet USDC
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const USDC_ABI = ERC20_ABI
