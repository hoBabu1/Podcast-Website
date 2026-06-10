import { addContact, sendWelcomeEmail } from './client'
import { WELCOME_EMAIL_SUBJECT, WELCOME_EMAIL_BODY } from './templates'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  process.env.BREVO_API_KEY = 'test-api-key'
  process.env.BREVO_LIST_ID = '5'
  process.env.BREVO_SENDER_EMAIL = 'sender@example.com'
  mockFetch.mockReset()
})

describe('addContact', () => {
  it('calls Brevo contacts API with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await addContact('Alice', 'alice@example.com')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/contacts')
    expect(options.method).toBe('POST')
    expect(options.headers['api-key']).toBe('test-api-key')

    const body = JSON.parse(options.body)
    expect(body.email).toBe('alice@example.com')
    expect(body.attributes.FIRSTNAME).toBe('Alice')
    expect(body.listIds).toEqual([5])
    expect(body.updateEnabled).toBe(true)
  })

  it('throws when Brevo returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'Bad Request' })

    await expect(addContact('Alice', 'alice@example.com')).rejects.toThrow('Brevo API error 400')
  })
})

describe('sendWelcomeEmail', () => {
  it('calls Brevo SMTP API with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await sendWelcomeEmail('Bob', 'bob@example.com')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.sender.email).toBe('sender@example.com')
    expect(body.to).toEqual([{ email: 'bob@example.com', name: 'Bob' }])
    expect(body.subject).toBe(WELCOME_EMAIL_SUBJECT)
    expect(body.htmlContent).toBe(WELCOME_EMAIL_BODY('Bob'))
  })
})
