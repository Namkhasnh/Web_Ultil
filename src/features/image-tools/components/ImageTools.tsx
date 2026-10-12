"use client";

import { useImageProcessor } from "../hooks/useImageProcessor";
import type { ImageOperation } from "../types";
import { ImageUploader } from "./ImageUploader";
import { ImageOptionsForm } from "./ImageOptionsForm";
import { ImagePreview } from "./ImagePreview";

const tools: { id: ImageOperation; label: string; icon: string; description: string }[] = [
  { id: "resize", label: "Resize", icon: "📐", description: "Set exact pixel dimensions or scale your images, with optional aspect lock." },
  { id: "convert", label: "Convert", icon: "🔄", description: "Switch between PNG, JPG and WebP instantly." },
  { id: "compress", label: "Compress", icon: "🗜️", description: "Reduce file size with a quality slider and before / after preview." },
];
export function ImageTools() {
  const processor = useImageProcessor();
  const selected = processor.files.find(file => file.id === processor.selectedId);
  return <div className="mx-auto max-w-[1180px] px-[clamp(16px,5vw,40px)] pt-9 pb-20">
    <p className="text-[13px] font-semibold text-[#3B6EF6]">🖼️ IMAGE TOOLS</p><h1 className="mt-2 font-heading text-[clamp(30px,5vw,40px)] font-extrabold tracking-[-0.02em]">Transform your images</h1><p className="mt-2 text-base text-soft">{tools.find(tool => tool.id === processor.settings.operation)?.description}</p>
    <div role="tablist" aria-label="Image tools" className="mt-6 flex flex-wrap gap-3" onKeyDown={event => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key) || processor.busy) return;
      event.preventDefault();
      const index = tools.findIndex(tool => tool.id === processor.settings.operation);
      const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
      processor.updateSettings({ operation: tools[next].id }); document.getElementById(`image-tab-${tools[next].id}`)?.focus();
    }}>{tools.map(tool => <button key={tool.id} id={`image-tab-${tool.id}`} role="tab" type="button" aria-selected={processor.settings.operation === tool.id} aria-controls="image-tool-panel" tabIndex={processor.settings.operation === tool.id ? 0 : -1} disabled={processor.busy} onClick={() => processor.updateSettings({ operation: tool.id })} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[13px] border bg-surface px-[18px] py-3 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-[#3B6EF6] disabled:opacity-60 ${processor.settings.operation === tool.id ? "border-[#3B6EF6]/40 font-bold text-[#3B6EF6] shadow-[0_12px_26px_-16px_#3B6EF6]" : "border-border text-mute hover:text-soft"}`}><span aria-hidden="true">{tool.icon}</span>{tool.label}</button>)}</div>
    {processor.error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{processor.error}</p>}
    <div id="image-tool-panel" role="tabpanel" aria-labelledby={`image-tab-${processor.settings.operation}`} className="mt-6 grid items-start gap-6 min-[760px]:grid-cols-[0.95fr_1.25fr]">
      <div className="min-w-0"><ImageUploader files={processor.files} selectedId={processor.selectedId} busy={processor.busy} onAdd={processor.addFiles} onSample={processor.addSample} onRemove={processor.removeFile} onSelect={processor.selectFile} /><ImageOptionsForm settings={processor.settings} selected={selected} busy={processor.busy} hasFiles={processor.files.some(file => file.width)} onChange={processor.updateSettings} onProcess={processor.process} onSample={processor.addSample} /></div>
      <ImagePreview selected={selected} outputs={processor.outputs} busy={processor.busy} processing={processor.status === "processing"} progress={processor.progress} onAgain={processor.again} />
    </div>
    <p className="mt-6 text-center text-xs text-mute" aria-live="polite">{processor.status === "validating" ? "Checking your images…" : "100% in-browser · Free · Files never leave your device"}</p>
  </div>;
}
