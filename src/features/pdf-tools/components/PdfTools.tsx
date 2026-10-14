"use client";

import { usePdfProcessor } from "../hooks/usePdfProcessor";
import type { SupportedPDFOperation } from "../types";
import { PdfUploader } from "./PdfUploader";
import { PdfOptionsForm } from "./PdfOptionsForm";
import { PdfResult } from "./PdfResult";

const tools: { id: SupportedPDFOperation; label: string; icon: string; description: string }[] = [
  { id: "merge", label: "Merge", icon: "🔗", description: "Combine multiple PDFs into one file, in the order you choose." },
  { id: "split", label: "Split", icon: "✂️", description: "Extract selected pages or ranges into a new PDF." },
  { id: "compress", label: "Compress", icon: "🗜️", description: "Reduce embedded image size while keeping selectable text and forms." },
];
export function PdfTools() {
  const processor = usePdfProcessor();
  const canProcess = processor.files.every(file => !!file.pageCount && !file.error) && (processor.operation === "merge" ? processor.files.length >= 2 : processor.files.length === 1 && (processor.operation === "compress" || !!processor.ranges.trim()));
  return <div className="mx-auto max-w-[1180px] px-[clamp(16px,5vw,40px)] pt-9 pb-20">
    <p className="text-[13px] font-semibold text-[#FF5470]">📄 PDF TOOLS</p><h1 className="mt-2 font-heading text-[clamp(30px,5vw,40px)] font-extrabold tracking-[-0.02em]">Work with your PDFs</h1><p className="mt-2 text-base text-soft">{tools.find(tool => tool.id === processor.operation)?.description}</p>
    <div role="tablist" aria-label="PDF tools" className="mt-6 flex flex-wrap gap-3" onKeyDown={event => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key) || processor.busy) return;
      event.preventDefault();
      const index = tools.findIndex(tool => tool.id === processor.operation);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tools.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tools.length - 1)) % tools.length;
      if (tools[next].id !== processor.operation) processor.changeOperation(tools[next].id); document.getElementById(`pdf-tab-${tools[next].id}`)?.focus();
    }}>{tools.map(tool => <button key={tool.id} id={`pdf-tab-${tool.id}`} role="tab" type="button" aria-selected={processor.operation === tool.id} aria-controls="pdf-tool-panel" tabIndex={processor.operation === tool.id ? 0 : -1} disabled={processor.busy} onClick={() => { if (processor.operation !== tool.id) processor.changeOperation(tool.id); }} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[13px] border bg-surface px-[18px] py-3 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-[#FF5470] disabled:opacity-60 ${processor.operation === tool.id ? "border-[#FF5470]/40 text-[#FF5470] shadow-[0_12px_26px_-16px_#FF5470]" : "border-border text-mute hover:text-soft"}`}><span aria-hidden="true">{tool.icon}</span>{tool.label}</button>)}</div>
    {processor.error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600 [[data-theme=dark]_&]:text-red-400">{processor.error}</p>}
    <div id="pdf-tool-panel" role="tabpanel" aria-labelledby={`pdf-tab-${processor.operation}`} className="mt-6 grid items-start gap-6 min-[760px]:grid-cols-2">
      <PdfUploader files={processor.files} operation={processor.operation} busy={processor.busy} onAdd={processor.addFiles} onSample={processor.addSample} onRemove={processor.removeFile} onMove={processor.moveFile} />
      <div><PdfOptionsForm operation={processor.operation} ranges={processor.ranges} compressLevel={processor.compressLevel} onCompressLevelChange={processor.updateCompressLevel} pageCount={processor.files[0]?.pageCount} busy={processor.busy} canProcess={canProcess} onChange={processor.updateRanges} onProcess={processor.process} />
        {processor.busy && <p role="status" className="mt-4 rounded-xl bg-surface2 p-4 text-sm text-soft">{processor.status === "validating" ? "Checking your PDFs…" : "Processing your PDFs…"}</p>}
        {processor.result && <PdfResult result={processor.result} onAgain={processor.again} />}
      </div>
    </div><p className="mt-6 text-center text-xs text-mute">100% in-browser · Free · Files never leave your device</p>
  </div>;
}
