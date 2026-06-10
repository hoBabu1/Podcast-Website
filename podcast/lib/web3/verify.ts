import { createPublicClient, http, decodeEventLog, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { USDC_ADDRESS } from './contracts'

// This USDC contract uses 18 decimals (not the standard 6)
const AMOUNT_BY_SESSION: Record<2 | 3, bigint> = {
  2: 50000000000000000000n,
  3: 100000000000000000000n,
}

const TRANSFER_EVENT_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

export async function verifyUsdcPayment(
  txHash: string,
  sessionId: 2 | 3
): Promise<{ valid: boolean; reason?: string }> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.ALCHEMY_RPC_URL),
  })

  // Wait for the tx to be mined. viem polls every `pollingInterval` and resolves
  // the moment the receipt is available — much faster than a fixed 3s loop on
  // Base's ~2s blocks. Times out at 60s so a never-mined tx doesn't hang the route.
  let receipt
  try {
    receipt = await client.waitForTransactionReceipt({
      hash: txHash as Hex,
      pollingInterval: 1000,
      timeout: 60_000,
      confirmations: 1,
    })
  } catch {
    return { valid: false, reason: 'tx_not_found' }
  }

  if (receipt.status !== 'success') {
    return { valid: false, reason: 'tx_failed' }
  }

  // NOTE: We do NOT check `receipt.to` against the USDC contract. Smart-contract
  // wallets (e.g. Coinbase Smart Wallet / account abstraction) route the transfer
  // through the wallet contract, so `receipt.to` is the wallet, not USDC. Security
  // is enforced below by scanning the logs for a Transfer event emitted *by* the
  // USDC contract with the correct recipient and amount — which works for both
  // EOAs and smart wallets.
  const paymentAddress = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS
  const expectedAmount = AMOUNT_BY_SESSION[sessionId]

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) continue

    try {
      const decoded = decodeEventLog({
        abi: TRANSFER_EVENT_ABI,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      })

      if (decoded.eventName !== 'Transfer') continue

      const { to, value } = decoded.args as { from: string; to: string; value: bigint }

      // A smart wallet may emit several USDC transfers in one tx (e.g. a paymaster
      // gas transfer). Don't fail on a mismatch — keep scanning until we find the
      // one that matches our payment address and amount.
      if (
        to.toLowerCase() === paymentAddress?.toLowerCase() &&
        value === expectedAmount
      ) {
        return { valid: true }
      }
    } catch {
      continue
    }
  }

  return { valid: false, reason: 'no_matching_transfer' }
}
