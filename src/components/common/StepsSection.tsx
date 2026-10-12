import type { StepsSectionProps } from "@/types/layout";

const accentClasses = {
  newsletter: "bg-[#7C3AED]/14 text-[#9061F0]",
  image: "bg-[#3B6EF6]/14 text-[#3B6EF6]",
  pdf: "bg-[#FF5470]/14 text-[#FF5470]",
};

export function StepsSection({ id, title, description, steps }: StepsSectionProps) {
  return (
    <section aria-labelledby={id} className="mx-auto mt-16 max-w-[1140px] px-6">
      <div className="text-center"><h2 id={id} className="font-heading text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-.02em]">{title}</h2>{description != null && <p className="mt-2 text-base text-soft">{description}</p>}</div>
      <ol className="mt-9 grid gap-4 min-[760px]:grid-cols-3 min-[760px]:gap-5">{steps.map((step, index) => <li key={step.title} className="rounded-[20px] border border-border bg-surface p-7"><span className={`flex size-11 items-center justify-center rounded-[13px] font-heading text-lg font-extrabold ${accentClasses[step.accent]}`}>{index + 1}</span><h3 className="mt-4 font-heading text-[19px] font-bold">{step.title}</h3><p className="mt-2 text-[15px] leading-[1.55] text-soft">{step.description}</p></li>)}</ol>
    </section>
  );
}
