import type { ReactNode } from "react";

export function StatCard({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
        <div className="flex flex-col justify-center rounded-3xl border border-white/6 bg-[#0F1222] p-[26px] text-white"><p className="font-heading text-[34px] font-extrabold">{title}</p><p className="mt-1.5 text-sm text-[#A6ABBC]">{description}</p></div>
  );
}
