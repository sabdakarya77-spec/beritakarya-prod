type LegalPageHeaderProps = {
  title: string
  eyebrow?: string
  subtitle?: string
}

export function LegalPageHeader({
  title,
  eyebrow,
  subtitle,
}: LegalPageHeaderProps) {
  return (
    <header className="mb-6 md:mb-8">
      {eyebrow ? (
        <div className="flex items-center gap-3 mb-4">
          <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden />
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-red">
            {eyebrow}
          </span>
        </div>
      ) : null}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-brand-black dark:text-white uppercase leading-none tracking-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-sm md:text-base text-brand-text-muted mt-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
