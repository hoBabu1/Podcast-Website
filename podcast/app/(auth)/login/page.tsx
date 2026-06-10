'use client'

import { useState } from 'react'
import { EmailStep } from '@/components/auth/EmailStep'
import { OtpStep } from '@/components/auth/OtpStep'
import { NameStep } from '@/components/auth/NameStep'

type Step = 'email' | 'otp' | 'name'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  function handleEmailSuccess(submittedEmail: string) {
    setEmail(submittedEmail)
    setStep('otp')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-brand-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="w-8 h-8 rounded bg-brand-amberDark inline-block mb-4" aria-hidden="true" />
          <h1 className="text-brand-heading text-2xl font-bold tracking-tight">DefiLords</h1>
          {step === 'email' && (
            <p className="text-brand-body text-sm mt-2">Enter your email to get started</p>
          )}
          {step === 'otp' && (
            <p className="text-brand-body text-sm mt-2">Check your inbox</p>
          )}
        </div>

        {step === 'email' && (
          <EmailStep onSuccess={handleEmailSuccess} />
        )}
        {step === 'otp' && (
          <OtpStep email={email} onNewUser={() => setStep('name')} />
        )}
        {step === 'name' && (
          <NameStep email={email} />
        )}
      </div>
    </div>
  )
}
