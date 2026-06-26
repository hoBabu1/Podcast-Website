process.env.NEXT_PUBLIC_USDC_ADDRESS = '0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64'
process.env.NEXT_PUBLIC_USDC_DECIMALS = '18'
process.env.NEXT_PUBLIC_USDT_ADDRESS = '0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
process.env.NEXT_PUBLIC_USDT_DECIMALS = '18'

import { USDC_ADDRESS, USDC_ABI, SUPPORTED_TOKENS, ERC20_ABI } from './contracts'

describe('backward-compat aliases', () => {
  it('USDC_ADDRESS is the Base mainnet USDC contract address', () => {
    expect(USDC_ADDRESS).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
  })

  it('USDC_ABI includes the transfer function', () => {
    const transferFn = USDC_ABI.find((entry) => entry.name === 'transfer')
    expect(transferFn).toBeDefined()
    expect(transferFn?.type).toBe('function')
    expect(transferFn?.stateMutability).toBe('nonpayable')
  })

  it('transfer function has correct input parameters', () => {
    const transferFn = USDC_ABI.find((entry) => entry.name === 'transfer')!
    const inputs = transferFn.inputs
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toMatchObject({ name: 'to', type: 'address' })
    expect(inputs[1]).toMatchObject({ name: 'amount', type: 'uint256' })
  })
})

describe('ERC20_ABI', () => {
  it('includes transfer function', () => {
    const fn = ERC20_ABI.find((e) => e.name === 'transfer')
    expect(fn).toBeDefined()
    expect(fn?.stateMutability).toBe('nonpayable')
  })

  it('includes decimals function', () => {
    const fn = ERC20_ABI.find((e) => e.name === 'decimals')
    expect(fn).toBeDefined()
    expect(fn?.stateMutability).toBe('view')
  })
})

describe('SUPPORTED_TOKENS', () => {
  it('USDC reads address and decimals from env', () => {
    expect(SUPPORTED_TOKENS.USDC.address).toBe('0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64')
    expect(SUPPORTED_TOKENS.USDC.decimals).toBe(18)
    expect(SUPPORTED_TOKENS.USDC.symbol).toBe('USDC')
  })

  it('USDT reads address and decimals from env', () => {
    expect(SUPPORTED_TOKENS.USDT.address).toBe('0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa')
    expect(SUPPORTED_TOKENS.USDT.decimals).toBe(18)
    expect(SUPPORTED_TOKENS.USDT.symbol).toBe('USDT')
  })
})
