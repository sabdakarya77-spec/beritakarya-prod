type LegalPageIntroProps = {
  text: string
}

export function LegalPageIntro({ text }: LegalPageIntroProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm md:text-base text-brand-text-muted leading-relaxed">{text}</p>
    </div>
  )
}
