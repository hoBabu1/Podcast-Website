// Valid Ethereum addresses (all hex)
const PAYMENT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const SENDER_ADDRESS  = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const USDC_ADDR       = '0xf7464321dE37BdE4C03AAeeF6b1e7b71379A9a64'
const USDT_ADDR       = '0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'

process.env.ALCHEMY_RPC_URL            = 'https://alchemy.example.com'
process.env.NEXT_PUBLIC_PAYMENT_ADDRESS = PAYMENT_ADDRESS
process.env.NEXT_PUBLIC_USDC_ADDRESS   = USDC_ADDR

jest.mock('viem', () => {
  const actual = jest.requireActual('viem')
  return {
    ...actual,
    createPublicClient: jest.fn(),
    http: jest.fn(),
  }
})

import { createPublicClient } from 'viem'
import { verifyERC20Payment } from './verify'

// Pad an address (0x...) to a 32-byte topic
function addrTopic(addr: string): string {
  return '0x000000000000000000000000' + addr.slice(2).toLowerCase()
}

// Transfer event signature
const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// ABI-encode a uint256 as a 32-byte (64 hex char) data word
function abiUint256(value: bigint): `0x${string}` {
  return `0x${value.toString(16).padStart(64, '0')}` as `0x${string}`
}

const AMOUNT_50  = abiUint256(50n  * BigInt(10 ** 18))   // 50 USDC × 10^18
const AMOUNT_100 = abiUint256(100n * BigInt(10 ** 18))   // 100 USDC × 10^18

function makeTransferLog(contractAddr: string, to: string, data: string) {
  return {
    address: contractAddr.toLowerCase(),
    data,
    topics: [TRANSFER_SIG, addrTopic(SENDER_ADDRESS), addrTopic(to)],
  }
}

const validLog50  = makeTransferLog(USDC_ADDR, PAYMENT_ADDRESS, AMOUNT_50)
const validLog100 = makeTransferLog(USDC_ADDR, PAYMENT_ADDRESS, AMOUNT_100)

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    waitForTransactionReceipt: jest.fn().mockResolvedValue({
      status: 'success',
      logs: [validLog50],
      ...overrides,
    }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createPublicClient as jest.Mock).mockReturnValue(makeClient())
})

describe('verifyERC20Payment', () => {
  it('returns { valid: true } for a valid session-2 USDC transfer', async () => {
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: true } for a valid session-3 USDC transfer', async () => {
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [validLog100] })
    )
    const result = await verifyERC20Payment('0x' + 'b'.repeat(64), 3, USDC_ADDR, 18)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: true } for a valid session-2 USDT transfer', async () => {
    const usdtLog = makeTransferLog(USDT_ADDR, PAYMENT_ADDRESS, AMOUNT_50)
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [usdtLog] })
    )
    const result = await verifyERC20Payment('0x' + 'c'.repeat(64), 2, USDT_ADDR, 18)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: false, reason: "no_matching_transfer" } when USDC log is checked against USDT address', async () => {
    // USDC transfer log but we pass USDT_ADDR as expected contract — should not match
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [validLog50] })
    )
    const result = await verifyERC20Payment('0x' + 'd'.repeat(64), 2, USDT_ADDR, 18)
    expect(result).toEqual({ valid: false, reason: 'no_matching_transfer' })
  })

  it('uses decimals parameter correctly — wrong decimals produce no match', async () => {
    // The log encodes 50 × 10^18 but if we compute expected with decimals=6 it expects
    // 50 × 10^6 = 50000000 which does not match.
    const result = await verifyERC20Payment('0x' + 'e'.repeat(64), 2, USDC_ADDR, 6)
    expect(result).toEqual({ valid: false, reason: 'no_matching_transfer' })
  })

  it('returns { valid: false, reason: "tx_failed" } when status is reverted', async () => {
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ status: 'reverted' })
    )
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: false, reason: 'tx_failed' })
  })

  it('returns { valid: true } for a smart-wallet tx where tx.to is the wallet, not the token', async () => {
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ to: '0x0000000000000000000000000000000000000001' })
    )
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: true } when a matching Transfer is present among several logs', async () => {
    const gasLog = makeTransferLog(USDC_ADDR, '0x1111111111111111111111111111111111111111', AMOUNT_50)
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [gasLog, validLog50] })
    )
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: false, reason: "no_matching_transfer" } when Transfer goes to wrong address', async () => {
    const wrongLog = makeTransferLog(USDC_ADDR, '0x1111111111111111111111111111111111111111', AMOUNT_50)
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [wrongLog] })
    )
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: false, reason: 'no_matching_transfer' })
  })

  it('returns { valid: false, reason: "no_matching_transfer" } when amount does not match', async () => {
    const wrongAmountLog = makeTransferLog(
      USDC_ADDR,
      PAYMENT_ADDRESS,
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
    ;(createPublicClient as jest.Mock).mockReturnValue(
      makeClient({ logs: [wrongAmountLog] })
    )
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: false, reason: 'no_matching_transfer' })
  })

  it('returns { valid: false, reason: "tx_not_found" } when receipt never arrives', async () => {
    ;(createPublicClient as jest.Mock).mockReturnValue({
      waitForTransactionReceipt: jest.fn().mockRejectedValue(new Error('timed out')),
    })
    const result = await verifyERC20Payment('0x' + 'a'.repeat(64), 2, USDC_ADDR, 18)
    expect(result).toEqual({ valid: false, reason: 'tx_not_found' })
  })
})
