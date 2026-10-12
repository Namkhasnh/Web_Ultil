import Link from "next/link";
import type { ToolCardProps } from "@/types/layout";

const cardInteraction = "transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9061F0] motion-reduce:transform-none motion-reduce:transition-none";

export function ToolCard({ href, title, icon, description, tags, cta, variant }: ToolCardProps) {
  if (variant === "pdf") return (
    <Link href={href} className={`relative min-h-[300px] overflow-hidden rounded-3xl bg-linear-150 from-[#FF5470] to-[#FF9A3C] p-[30px] text-white shadow-[0_26px_50px_-26px_rgba(255,84,112,.6)] min-[760px]:row-span-2 ${cardInteraction}`}>
      <div aria-hidden="true" className="text-4xl">{icon}</div>
      <h2 className="mt-4 font-heading text-[30px] font-extrabold">{title}</h2>
      <p className="mt-2.5 max-w-60 text-base text-white/92">{description}</p>
      {tags && tags.length > 0 && <div className="mt-[22px] flex flex-wrap gap-2">{tags.map(label => <span key={label} className="rounded-full bg-white/20 px-[13px] py-[7px] text-[13px] font-semibold">{label}</span>)}</div>}
      {cta != null && <span className="mt-6 inline-block text-[15px] font-bold">{cta}</span>}
    </Link>
  );
  if (variant === "image") return (
    <Link href={href} className={`relative flex flex-wrap justify-between gap-4 overflow-hidden rounded-3xl bg-linear-135 from-[#3B6EF6] to-[#22D3EE] p-7 text-white shadow-[0_26px_50px_-26px_rgba(59,110,246,.6)] min-[760px]:col-span-2 ${cardInteraction}`}>
      <div><div aria-hidden="true" className="text-[30px]">{icon}</div><h2 className="mt-3 font-heading text-[26px] font-extrabold">{title}</h2><p className="mt-2 max-w-80 text-[15px] text-white/92">{description}</p></div>
      {tags && tags.length > 0 && <div className="mt-[22px] flex flex-wrap gap-2">{tags.map(label => <span key={label} className="rounded-full bg-white/20 px-[13px] py-[7px] text-[13px] font-semibold">{label}</span>)}</div>}
      {cta != null && <span className="self-end text-[15px] font-bold whitespace-nowrap">{cta}</span>}
    </Link>
  );
  return (
    <Link href={href} className={`rounded-3xl bg-linear-150 from-[#8B5CF6] to-[#EC4899] p-[26px] text-white shadow-[0_26px_50px_-26px_rgba(139,92,246,.6)] ${cardInteraction}`}>
      <div aria-hidden="true" className="text-[28px]">{icon}</div><h2 className="mt-3 font-heading text-[22px] font-extrabold">{title}</h2><p className="mt-1.5 text-sm text-white/92">{description}</p>
      {tags && tags.length > 0 && <div className="mt-[22px] flex flex-wrap gap-2">{tags.map(label => <span key={label} className="rounded-full bg-white/20 px-[13px] py-[7px] text-[13px] font-semibold">{label}</span>)}</div>}

    {cta != null && <span className="mt-6 inline-block text-[15px] font-bold">{cta}</span>}
    </Link>
  );
}
