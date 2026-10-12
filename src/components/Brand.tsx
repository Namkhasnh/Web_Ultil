import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="WebUtil home" className="inline-flex min-h-11 items-center gap-2.5 rounded-lg font-heading focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9061F0]">
      <span aria-hidden="true" className={`flex items-center justify-center bg-linear-135 from-[#7C3AED] to-[#EC4899] font-extrabold text-white ${compact ? "size-[26px] rounded-lg text-[13px]" : "size-8 rounded-[9px]"}`}>W</span>
      <span className={compact ? "font-bold" : "text-[19px] font-extrabold"}>WebUtil</span>
    </Link>
  );
}
