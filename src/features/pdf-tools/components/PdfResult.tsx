import { downloadBlob } from "@/lib/download";
import { formatFileSize } from "@/lib/format-file-size";
import type { PDFProcessResult } from "../types";
import { pdfPrimaryButton } from "./PdfOptionsForm";

export function PdfResult({ result, onAgain }: { result: PDFProcessResult; onAgain: () => void }) {
  return <section role="status" aria-label="PDF result" className="mt-4 rounded-[18px] border border-green-500/20 bg-green-500/10 p-5 motion-safe:animate-pop-in">
    <h2 className="font-heading text-lg font-bold">✓ Done</h2><p className="mt-3 break-all font-semibold">{result.outputFileName}</p><p className="mt-1 text-sm text-soft">{formatFileSize(result.outputSize)}</p>
    {result.operation === "compress" && <div className="mt-2 text-sm text-soft"><p>{formatFileSize(result.originalSize)} → {formatFileSize(result.outputSize)} · {((1 - result.outputSize / result.originalSize) * 100).toFixed(1)}% saved</p><p className="mt-2">{result.outputSize < result.originalSize ? "Text and image quality preserved." : "This PDF is already optimized; file size did not decrease."}</p></div>}
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => downloadBlob(result.outputBlob, result.outputFileName)} className={pdfPrimaryButton}><span aria-hidden="true">⬇ </span>Download PDF</button><button type="button" onClick={onAgain} className="min-h-11 cursor-pointer rounded-xl bg-surface2 px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#FF5470]">Again</button></div>
  </section>;
}
