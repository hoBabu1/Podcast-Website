const GITHUB_URL = 'https://github.com/DefiLords'
const AI_VAULTS_URL = 'https://aivaults.defilords.finance/'

export function DevSection() {
  return (
    <section
      id="invest"
      className="bg-brand-surface border-t border-brand-border"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-brand-heading text-2xl sm:text-3xl font-bold mb-4">
          Build with DefiLords
        </h2>
        <p className="text-brand-body text-base max-w-xl mb-8">
          We&apos;re open to developers who want to contribute and investors who
          want to grow with us.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-amber text-brand-bg font-semibold text-base hover:bg-brand-amberDark transition-colors"
          >
            View on GitHub →
          </a>
          <a
            href={AI_VAULTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-brand-amber text-brand-amber font-semibold text-base hover:bg-brand-amberDeep transition-colors"
          >
            Explore AI Vaults →
          </a>
        </div>
      </div>
    </section>
  )
}
