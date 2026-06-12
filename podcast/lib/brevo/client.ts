import { WELCOME_EMAIL_SUBJECT, WELCOME_EMAIL_BODY, OTP_EMAIL } from './templates'

const BREVO_API_BASE = 'https://api.brevo.com/v3'

async function brevoRequest(path: string, body: unknown): Promise<void> {
  const key = (process.env.BREVO_API_KEY ?? '').trim()
  const res = await fetch(`${BREVO_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseText = await res.text()

  if (!res.ok) {
    console.error(`[Brevo] API error — status: ${res.status}, path: ${path}, body: ${responseText}`)
    throw new Error(`Brevo API error ${res.status}: ${responseText}`)
  }
}

export async function addContact(name: string, email: string): Promise<void> {
  await brevoRequest('/contacts', {
    email,
    attributes: { FIRSTNAME: name },
    listIds: [Number(process.env.BREVO_LIST_ID!)],
    updateEnabled: true,
  })
}

export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  await brevoRequest('/smtp/email', {
    sender: { name: 'DefiLords', email: process.env.BREVO_SENDER_EMAIL! },
    to: [{ email, name }],
    subject: WELCOME_EMAIL_SUBJECT,
    htmlContent: WELCOME_EMAIL_BODY(name),
  })
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await brevoRequest('/smtp/email', {
    sender: { name: 'DefiLords', email: process.env.BREVO_SENDER_EMAIL! },
    to: [{ email }],
    subject: OTP_EMAIL.subject,
    textContent: OTP_EMAIL.body(code),
  })
}
