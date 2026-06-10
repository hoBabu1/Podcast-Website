/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { WalletButton } from './WalletButton'

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useDisconnect: jest.fn(() => ({ disconnect: jest.fn() })),
}))

jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button data-testid="rk-connect-button">Connect Wallet</button>,
}))

import { useAccount } from 'wagmi'

const CONNECTED_ADDRESS = '0xABCDEF1234567890abcdef1234567890ABCDEF12'

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})

afterEach(() => jest.useRealTimers())

describe('WalletButton', () => {
  it('renders the RainbowKit ConnectButton when wallet is not connected', () => {
    ;(useAccount as jest.Mock).mockReturnValue({ isConnected: false, address: undefined })
    render(<WalletButton />)
    expect(screen.getByTestId('rk-connect-button')).toBeInTheDocument()
  })

  it('renders shortened wallet address when connected', () => {
    ;(useAccount as jest.Mock).mockReturnValue({ isConnected: true, address: CONNECTED_ADDRESS })
    render(<WalletButton />)
    expect(screen.getByText('0xABCD...EF12')).toBeInTheDocument()
  })

  it('renders disconnect button when connected', () => {
    ;(useAccount as jest.Mock).mockReturnValue({ isConnected: true, address: CONNECTED_ADDRESS })
    render(<WalletButton />)
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
  })

  it('copies full address to clipboard and shows Copied! on click', async () => {
    ;(useAccount as jest.Mock).mockReturnValue({ isConnected: true, address: CONNECTED_ADDRESS })
    render(<WalletButton />)

    await act(async () => {
      fireEvent.click(screen.getByText('0xABCD...EF12'))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CONNECTED_ADDRESS)
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('reverts from Copied! back to short address after 1.5 seconds', async () => {
    ;(useAccount as jest.Mock).mockReturnValue({ isConnected: true, address: CONNECTED_ADDRESS })
    render(<WalletButton />)

    await act(async () => {
      fireEvent.click(screen.getByText('0xABCD...EF12'))
    })

    expect(screen.getByText('Copied!')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(1500))

    expect(screen.getByText('0xABCD...EF12')).toBeInTheDocument()
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
  })
})
