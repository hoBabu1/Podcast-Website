process.env.NEXT_PUBLIC_USDC_ADDRESS = '0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64'

import { USDC_ADDRESS, USDC_ABI } from './contracts'

describe('USDC contract', () => {
  it('reads USDC address from NEXT_PUBLIC_USDC_ADDRESS', () => {
    expect(USDC_ADDRESS).toBe('0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64')
  })

  it('ABI includes the transfer function', () => {
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
