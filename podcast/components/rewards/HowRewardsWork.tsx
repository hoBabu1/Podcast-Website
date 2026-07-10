import { REWARD_CAMPAIGN_DAYS } from '@/constants/rewards'

const STEPS = [
  'One participant is selected at random after each session.',
  'DefiLords opens a live vault position for that winner.',
  `The position is tracked publicly on the website for ${REWARD_CAMPAIGN_DAYS} days.`,
  'The winner receives the harvest/yield generated during the campaign period.',
  'The original capital remains with DefiLords.',
]

export function HowRewardsWork() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-8">
        <h2 className="text-brand-heading text-2xl font-bold mb-2">How the rewards work</h2>
        <p className="text-brand-body text-sm mb-6">
          Every session comes with a sponsored vault reward. Here&apos;s exactly how it plays out.
        </p>

        <ol className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-amberDeep border border-brand-amberDark text-brand-amber text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-brand-body text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
