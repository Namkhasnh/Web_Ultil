import { FileDropZone } from "@/components/common/FileDropZone";
import { formatFileSize } from "@/lib/format-file-size";
import type { PDFFile, SupportedPDFOperation } from "../types";

type Props = { files: PDFFile[]; operation: SupportedPDFOperation; busy: boolean; onAdd: (files: File[]) => Promise<void>; onSample: () => Promise<void>; onRemove: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void };
const itemButton = "min-h-11 min-w-11 cursor-pointer rounded-lg px-2 text-soft hover:bg-surface2 focus-visible:outline-2 focus-visible:outline-[#FF5470] disabled:cursor-default disabled:opacity-40";
export function PdfUploader({ files, operation, busy, onAdd, onSample, onRemove, onMove }: Props) {
  return <section aria-label="PDF upload">
    <FileDropZone label="Choose PDFs" title={operation === "merge" ? "Drop PDFs here" : "Drop one PDF here"} icon="📄" accept="application/pdf,.pdf" formats="PDF" hint="Up to 20 MiB per PDF · Files stay on your device" accent="pdf" multiple={operation === "merge"} busy={busy} onAdd={onAdd} />
    <div className="mt-3 flex items-center justify-between"><span className="text-sm font-bold text-soft">{files.length} {files.length === 1 ? "PDF" : "PDFs"}</span><button type="button" disabled={busy} onClick={() => void onSample()} className={`${itemButton} text-[#FF5470]`}>+ add sample</button></div>
    <ul aria-label="PDF files" className="max-h-96 space-y-2 overflow-y-auto">{files.map((file, index) => <li key={file.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
      <span aria-hidden="true" className="text-2xl">📄</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.name}</p><p className="text-xs text-mute">{formatFileSize(file.size)}{file.pageCount ? ` · ${file.pageCount} pages` : ""} · {file.status}</p>{file.error && <p role="alert" className="text-xs text-red-600 [[data-theme=dark]_&]:text-red-400">{file.error}</p>}</div>
      <div className="flex">{operation === "merge" && <><button type="button" aria-label={`Move ${file.name} up`} disabled={busy || index === 0} onClick={() => onMove(file.id, -1)} className={itemButton}>↑</button><button type="button" aria-label={`Move ${file.name} down`} disabled={busy || index === files.length - 1} onClick={() => onMove(file.id, 1)} className={itemButton}>↓</button></>}<button type="button" aria-label={`Remove ${file.name}`} disabled={busy} onClick={() => onRemove(file.id)} className={itemButton}>✕</button></div>
    </li>)}</ul>
  </section>;
}
