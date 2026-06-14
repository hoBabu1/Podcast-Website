/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TokenSelector } from './TokenSelector'

process.env.NEXT_PUBLIC_USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
process.env.NEXT_PUBLIC_USDT_ADDRESS = '0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'

describe('TokenSelector', () => {
  it('renders both USDC and USDT options', () => {
    render(
      <TokenSelector selectedToken="USDC" onChange={() => {}} sessionPrice={50} />
    )
    expect(screen.getByText('USDC')).toBeDefined()
    expect(screen.getByText('USDT')).toBeDefined()
  })

  it('shows session price under each token', () => {
    render(
      <TokenSelector selectedToken="USDC" onChange={() => {}} sessionPrice={50} />
    )
    const priceLabels = screen.getAllByText(/\$50/)
    expect(priceLabels.length).toBe(2)
  })

  it('calls onChange with USDT when USDT button is clicked', () => {
    const onChange = jest.fn()
    render(
      <TokenSelector selectedToken="USDC" onChange={onChange} sessionPrice={50} />
    )
    fireEvent.click(screen.getByText('USDT').closest('button')!)
    expect(onChange).toHaveBeenCalledWith('USDT')
  })

  it('calls onChange with USDC when USDC button is clicked', () => {
    const onChange = jest.fn()
    render(
      <TokenSelector selectedToken="USDT" onChange={onChange} sessionPrice={100} />
    )
    fireEvent.click(screen.getByText('USDC').closest('button')!)
    expect(onChange).toHaveBeenCalledWith('USDC')
  })

  it('applies amber border class to the selected token button', () => {
    render(
      <TokenSelector selectedToken="USDT" onChange={() => {}} sessionPrice={50} />
    )
    const usdtButton = screen.getByText('USDT').closest('button')!
    expect(usdtButton.className).toContain('border-brand-amber')
  })

  it('applies muted border class to the unselected token button', () => {
    render(
      <TokenSelector selectedToken="USDT" onChange={() => {}} sessionPrice={50} />
    )
    const usdcButton = screen.getByText('USDC').closest('button')!
    expect(usdcButton.className).toContain('border-brand-border')
  })
})
