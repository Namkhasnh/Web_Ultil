import type { HeroSectionProps } from "@/types/layout";

export function HeroSection({ id, badge, title, description, actions, footnote, decoration }: HeroSectionProps) {
  return (
    <section aria-labelledby={id} className="relative overflow-hidden [background:var(--hero)]">
      {decoration}
      <div className="relative mx-auto max-w-[840px] px-6 pt-[clamp(60px,9vw,96px)] pb-[110px] text-center">
        {badge != null && <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/22 bg-[#7C3AED]/10 px-3.5 py-[7px] text-[13.5px] font-semibold text-[#9061F0]">{badge}</div>}
        <h1 id={id} className="mt-[22px] font-heading text-[clamp(38px,6vw,64px)] leading-[1.04] font-extrabold tracking-[-.03em]">{title}</h1>
        {description != null && <p className="mx-auto mt-5 max-w-[560px] text-[clamp(16px,2vw,19px)] leading-[1.55] text-soft">{description}</p>}
        {actions != null && <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
          {actions}
        </div>}
        {footnote != null && <p className="mt-[22px] text-[13.5px] text-mute">{footnote}</p>}
      </div>
    </section>
  );
}
