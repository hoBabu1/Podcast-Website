'use client'

import type { PaymentStatus } from '@/hooks/useWalletPayment'

interface Step {
  label: string
  detail: string
  estimate: string
}

const STEPS: Step[] = [
  {
    label: 'Save wallet',
    detail: 'Recording your wallet address',
    estimate: '~1s',
  },
  {
    label: 'Approve in wallet',
    detail: 'Waiting for your approval in MetaMask',
    estimate: 'Your action',
  },
  {
    label: 'Confirming & verifying',
    detail: 'Waiting for block confirmation, then checking payment on-chain',
    estimate: '15–90s',
  },
  {
    label: 'Access granted',
    detail: 'Redirecting to your session…',
    estimate: 'Done',
  },
]

const STATUS_TO_STEP: Record<PaymentStatus, number> = {
  idle: -1,
  'saving-wallet': 0,
  'sending-payment': 1,
  confirming: 2,
  verifying: 2,
  success: 3,
  error: -1,
}

interface PaymentProgressProps {
  status: PaymentStatus
}

export function PaymentProgress({ status }: PaymentProgressProps) {
  const activeStep = STATUS_TO_STEP[status]
  if (activeStep === -1) return null

  return (
    <div className="mt-1 flex flex-col">
      {STEPS.map((step, i) => {
        const isDone = i < activeStep
        const isActive = i === activeStep

        return (
          <div key={step.label} className="flex gap-3">
            {/* Left column — icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isDone
                    ? 'bg-brand-green'
                    : isActive
                      ? 'bg-brand-amber animate-pulse'
                      : 'bg-brand-border'
                }`}
              >
                {isDone ? (
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#141410"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    className={`text-[9px] font-bold leading-none ${
                      isActive ? 'text-brand-bg' : 'text-brand-muted'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Connecting line — skip after last step */}
              {i < STEPS.length - 1 && (
                <div
                  className={`w-px flex-1 my-0.5 min-h-[12px] ${
                    isDone ? 'bg-brand-green' : 'bg-brand-border'
                  }`}
                />
              )}
            </div>

            {/* Right column — text */}
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-xs font-semibold leading-tight ${
                    isDone
                      ? 'text-brand-green'
                      : isActive
                        ? 'text-brand-amber'
                        : 'text-brand-muted'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-brand-muted whitespace-nowrap flex-shrink-0">
                  {isDone ? '✓' : step.estimate}
                </span>
              </div>

              {isActive && (
                <p className="text-[11px] text-brand-body mt-0.5 leading-snug">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
