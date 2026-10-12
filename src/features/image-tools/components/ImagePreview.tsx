import Image from "next/image";
import { useState } from "react";
import { downloadBlob } from "@/lib/download";
import { formatFileSize } from "@/lib/format-file-size";
import type { ImageFile, ImageOutput } from "../types";
import { imagePrimaryButton } from "./ImageOptionsForm";

export function sizeChange(original: number, output: number): string {
  const change = (1 - output / original) * 100;
  return change >= 0 ? `saved ${change.toFixed(1)}%` : `${Math.abs(change).toFixed(1)}% larger`;
}
type Props = { selected?: ImageFile; outputs: ImageOutput[]; busy: boolean; processing: boolean; progress: number; onAgain: () => void };
export function ImagePreview({ selected, outputs, busy, processing, progress, onAgain }: Props) {
  const output = outputs.find(item => item.id === selected?.id);
  const [downloading, setDownloading] = useState(false);
  async function downloadAll() {
    setDownloading(true);
    try { for (const item of outputs) { downloadBlob(item.result.outputBlob, item.result.outputFileName); await new Promise(resolve => setTimeout(resolve, 250)); } }
    finally { setDownloading(false); }
  }
  return <section aria-label="Image preview" className="min-w-0 rounded-[20px] border border-border bg-surface p-6">
    <h2 className="font-heading text-lg font-bold">Preview</h2>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="min-w-0"><h3 className="text-xs font-bold tracking-wider text-mute uppercase">Before</h3><div className="relative mt-2 flex aspect-4/3 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-surface2 text-3xl">{selected?.previewUrl ? <Image unoptimized src={selected.previewUrl} alt={`Original ${selected.name}`} fill sizes="(max-width: 760px) 40vw, 260px" className="object-contain" /> : <span aria-hidden="true">🖼️</span>}</div><p className="mt-2 text-xs wrap-anywhere text-soft">{selected ? `${selected.name} · ${formatFileSize(selected.size)}${selected.width ? ` · ${selected.width} × ${selected.height}px` : ""}` : "No image yet"}</p></div>
      <div className="min-w-0"><h3 className="text-xs font-bold tracking-wider text-[#3B6EF6] uppercase">After</h3><div className="relative mt-2 flex aspect-4/3 items-center justify-center overflow-hidden rounded-[14px] border border-[#3B6EF6] bg-surface2 text-3xl">{output ? <><Image unoptimized src={output.previewUrl} alt={`Processed ${selected?.name}`} fill sizes="(max-width: 760px) 40vw, 260px" className="object-contain" /><span className="absolute top-2 right-2 rounded-full bg-green-600 px-2 py-1 text-[11px] font-bold text-white">✓ Ready</span></> : <span aria-hidden="true">⤵</span>}</div><p className="mt-2 text-xs font-semibold wrap-anywhere text-[#3B6EF6]">{output ? `${output.result.width} × ${output.result.height}px · ${output.result.outputFormat.toUpperCase()} · ${formatFileSize(output.result.outputSize)} · ${sizeChange(output.result.originalSize, output.result.outputSize)}` : "Apply to preview"}</p></div>
    </div>
    {processing && <div className="mt-5" role="progressbar" aria-label="Processing images" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="mb-2 flex justify-between text-sm text-soft"><span>Processing…</span><span>{progress}%</span></div><svg aria-hidden="true" viewBox="0 0 100 2" preserveAspectRatio="none" className="h-2.5 w-full overflow-hidden rounded-full bg-surface2"><defs><linearGradient id="image-progress-gradient"><stop stopColor="#3B6EF6" /><stop offset="1" stopColor="#22D3EE" /></linearGradient></defs><rect width={progress} height="2" fill="url(#image-progress-gradient)" /></svg></div>}
    {!busy && outputs.length > 0 && <div className="mt-5 rounded-xl bg-green-600/10 p-4 motion-safe:animate-pop-in"><p role="status" className="text-sm font-semibold text-green-700 [[data-theme=dark]_&]:text-green-400">✓ Done · {outputs.length} {outputs.length === 1 ? "image" : "images"} ready</p><div className="mt-3 flex flex-wrap gap-2">{output && <button type="button" onClick={() => downloadBlob(output.result.outputBlob, output.result.outputFileName)} className={imagePrimaryButton}>⬇ Download image</button>}{outputs.length > 1 && <button type="button" disabled={downloading} onClick={() => void downloadAll()} className={imagePrimaryButton}>{downloading ? "Downloading…" : "⬇ Download all"}</button>}<button type="button" onClick={onAgain} className="min-h-11 cursor-pointer rounded-xl bg-surface2 px-5 font-semibold text-soft hover:bg-border">Again</button></div></div>}
    {!busy && !outputs.length && <p className="mt-5 py-2 text-center text-sm text-mute">Add an image and hit <b className="text-[#3B6EF6]">Apply</b> to process it for real.</p>}
  </section>;
}
