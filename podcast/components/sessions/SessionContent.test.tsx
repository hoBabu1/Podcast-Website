/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { SessionContent } from './SessionContent'
import { SESSIONS } from '@/constants/sessions'

// next/link needs the router internals at runtime — render a plain anchor instead.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

describe('SessionContent', () => {
  it('renders the correct title for each session', () => {
    for (const session of SESSIONS) {
      const { unmount } = render(<SessionContent sessionId={session.id} />)
      expect(
        screen.getByRole('heading', { level: 1, name: session.title })
      ).toBeInTheDocument()
      unmount()
    }
  })

  it('shows the Watch on Twitter button pointing at the session Twitter URL (new tab)', () => {
    const session = SESSIONS[1] // session 2
    render(<SessionContent sessionId={session.id} />)
    const link = screen.getByRole('link', { name: /watch on twitter/i })
    expect(link).toHaveAttribute('href', session.twitterUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('shows an upsell nudge to Session 2 on the free Session 1', () => {
    render(<SessionContent sessionId={1} />)
    expect(screen.getByRole('link', { name: /unlock session 2/i })).toBeInTheDocument()
  })

  it('does not show the upsell nudge on a paid session', () => {
    render(<SessionContent sessionId={2} />)
    expect(screen.queryByRole('link', { name: /unlock session 2/i })).not.toBeInTheDocument()
  })

  it('shows GitHub and AI Vaults links on Session 3', () => {
    render(<SessionContent sessionId={3} />)
    expect(screen.getByRole('link', { name: /contribute on github/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /invest in ai vaults/i })).toBeInTheDocument()
  })

  it('does not show GitHub / AI Vaults links on Session 2', () => {
    render(<SessionContent sessionId={2} />)
    expect(screen.queryByRole('link', { name: /contribute on github/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /invest in ai vaults/i })).not.toBeInTheDocument()
  })

  it('shows lifetime access reassurance on paid sessions but not the free one', () => {
    const { unmount } = render(<SessionContent sessionId={2} />)
    expect(screen.getByText(/lifetime access/i)).toBeInTheDocument()
    unmount()

    render(<SessionContent sessionId={1} />)
    expect(screen.queryByText(/lifetime access/i)).not.toBeInTheDocument()
  })
})
