const SPACE_URL = 'https://twitter.com/i/spaces/1nJOLLZvRoExR'

export function SpaceBanner() {
  return (
    <a
      href={SPACE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Live on X Space — join us and win a $50 vault position"
      className="hidden lg:block fixed left-5 top-1/2 -translate-y-1/2 z-50 w-52 -rotate-6 hover:rotate-0 hover:scale-105 transition-transform duration-200"
    >
      <div className="relative bg-brand-amber text-brand-bg rounded-sm shadow-2xl shadow-black/50 px-4 pt-6 pb-4">
        {/* Tape strip */}
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-16 rotate-2 bg-brand-heading/70 rounded-[2px]" />

        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-bg opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-bg" />
          </span>
          Live on 𝕏 Space
        </span>

        <p className="mt-3 text-lg font-extrabold leading-tight">
          Win a $50 vault position
        </p>
        <p className="mt-1 text-sm font-medium text-brand-bg/80">
          Join our live Space to enter.
        </p>

        <span className="mt-3 inline-block text-sm font-bold underline underline-offset-4">
          Listen now →
        </span>
      </div>
    </a>
  )
}
