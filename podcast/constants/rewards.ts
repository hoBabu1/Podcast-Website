/**
 * Static copy describing the sponsored-vault reward tied to each session.
 * These amounts are the sponsored *capital* DefiLords puts up — not what the
 * winner receives. The winner only ever receives the yield/harvest generated
 * over the 14-day campaign; the principal stays with DefiLords. Keep the
 * wording on every surface consistent with that distinction.
 */
export const REWARDS = [
  {
    sessionId: 1,
    sponsoredAmount: 50,
  },
  {
    sessionId: 2,
    sponsoredAmount: 100,
  },
  {
    sessionId: 3,
    sponsoredAmount: 150,
  },
] as const

export const REWARD_CAMPAIGN_DAYS = 14

export const REWARD_DISCLAIMER =
  'DefiLords funds the position for 14 days. The winner receives the yield generated during that period, while the principal remains funded by DefiLords.'

export function getRewardForSession(sessionId: number) {
  return REWARDS.find((r) => r.sessionId === sessionId) ?? null
}
