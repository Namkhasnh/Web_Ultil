import type { CompressLevel } from "@/types";
import type { SupportedPDFOperation } from "../types";

export const pdfPrimaryButton = "min-h-11 cursor-pointer rounded-[13px] bg-linear-135 from-[#FF5470] to-[#FF9A3C] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_-12px_rgba(255,84,112,.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5470] disabled:cursor-default disabled:opacity-60";
const compressionLevels: { value: CompressLevel; label: string; description: string }[] = [
  { value: "low", label: "Light", description: "Optimize PDF structure; keep document metadata." },
  { value: "medium", label: "Balanced", description: "Optimize structure and remove document information such as title and author." },
  { value: "high", label: "Maximum", description: "Balanced optimization plus removal of document XMP metadata." },
];
type Props = { operation: SupportedPDFOperation; ranges: string; compressLevel: CompressLevel; onCompressLevelChange: (level: CompressLevel) => void; pageCount?: number; busy: boolean; canProcess: boolean; onChange: (value: string) => void; onProcess: () => Promise<void> };
export function PdfOptionsForm({ operation, ranges, compressLevel, onCompressLevelChange, pageCount, busy, canProcess, onChange, onProcess }: Props) {
  return <form onSubmit={event => { event.preventDefault(); if (canProcess && !busy) void onProcess(); }} className="rounded-[18px] border border-border bg-surface p-5">
    <h2 className="font-heading text-lg font-bold">{operation === "merge" ? "Merge options" : operation === "split" ? "Split options" : "Compress options"}</h2>
    {operation === "merge" ? <p className="mt-3 text-sm text-soft">Add at least two PDFs. Pages are combined in the order shown in the list. Use the arrows to change the order.</p> : operation === "split" ? <div className="mt-4"><label htmlFor="pdf-ranges" className="text-sm font-semibold">Page range</label><input id="pdf-ranges" value={ranges} disabled={busy} onChange={event => onChange(event.target.value)} placeholder="1-3,5" aria-describedby="pdf-range-hint" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface2 px-3 text-foreground focus-visible:outline-2 focus-visible:outline-[#FF5470]" /><p id="pdf-range-hint" className="mt-2 text-xs text-soft">{pageCount ? `${pageCount} pages available. ` : "Upload a PDF to see its page count. "}Example: 1-3,5. Pages follow your input order; duplicates are included only once.</p></div> : <fieldset disabled={busy} className="mt-4 space-y-3">
      <legend className="mb-2 text-sm font-semibold">Compression level</legend>
      {compressionLevels.map(level => <label key={level.value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface2 p-3">
        <input type="radio" name="pdf-compression-level" value={level.value} checked={compressLevel === level.value} onChange={() => onCompressLevelChange(level.value)} className="mt-1 accent-[#FF5470]" />
        <span><span className="block text-sm font-semibold">{level.label}</span><span className="block text-xs text-soft">{level.description}</span></span>
      </label>)}
      <p className="text-xs text-soft">Keeps text and image quality. Scanned or already optimized PDFs may not get smaller. If size does not decrease, the original file is returned.</p>
    </fieldset>}
    <button type="submit" disabled={!canProcess || busy} className={`mt-5 w-full ${pdfPrimaryButton}`}>{busy ? "Working…" : operation === "merge" ? "Merge PDFs" : operation === "split" ? "Split PDF" : "Compress PDF"}</button>
  </form>;
}
