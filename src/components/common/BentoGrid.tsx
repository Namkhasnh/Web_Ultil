import type { ReactNode } from "react";

export function BentoGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="mx-auto max-w-[1140px] px-6 pt-2 pb-5">
      <div className="grid gap-[18px] min-[760px]:grid-cols-[1.35fr_1fr_1fr] min-[760px]:auto-rows-fr">{children}</div>
    </section>
  );
}
