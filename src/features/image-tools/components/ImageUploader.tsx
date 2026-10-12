"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { formatFileSize } from "@/lib/format-file-size";
import type { ImageFile } from "../types";

type Props = { files: ImageFile[]; selectedId: string; busy: boolean; onAdd: (files: File[]) => Promise<void>; onSample: () => Promise<void>; onRemove: (id: string) => void; onSelect: (id: string) => void };
export function ImageUploader({ files, selectedId, busy, onAdd, onSample, onRemove, onSelect }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return <section aria-label="Image upload">
    <input ref={input} aria-label="Choose images" type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={busy} className="sr-only" onChange={event => { void onAdd(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) void onAdd(Array.from(event.dataTransfer.files)); }} className={`w-full cursor-pointer rounded-[18px] border-2 border-dashed px-5 py-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#3B6EF6] disabled:cursor-wait ${dragging ? "border-[#3B6EF6] bg-[#3B6EF6]/10" : "border-border bg-surface hover:border-[#3B6EF6]/50"}`}>
      <span aria-hidden="true" className="block text-[34px]">🖼️</span><span className="mt-2.5 block font-heading text-[17px] font-bold">Drop images here</span>
      <span className="mt-1.5 block text-sm text-soft">or <span className="font-semibold text-[#3B6EF6]">browse</span> · JPG, PNG, WebP</span><span className="mt-2 block text-xs text-mute">Up to 20 MiB per image · Files stay on your device</span>
    </button>
    <div className="mt-3 flex items-center justify-between"><span className="text-sm font-bold text-soft">{files.length} {files.length === 1 ? "image" : "images"}</span><button type="button" disabled={busy} onClick={() => void onSample()} className="min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[#3B6EF6] hover:bg-surface2 disabled:opacity-50">+ add sample</button></div>
    <ul className="max-h-80 space-y-2 overflow-y-auto">{files.map(file => <li key={file.id} className={`flex items-center gap-2 rounded-xl border bg-surface p-2 ${selectedId === file.id ? "border-[#3B6EF6]" : "border-border"}`}>
      <button type="button" aria-label={`Preview ${file.name}`} aria-pressed={selectedId === file.id} onClick={() => onSelect(file.id)} className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[#3B6EF6]">
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface2">{file.previewUrl ? <Image unoptimized src={file.previewUrl} alt="" fill sizes="44px" className="object-cover" /> : <span aria-hidden="true">🖼️</span>}</span>
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{file.name}</span><span className="block text-xs text-mute">{formatFileSize(file.size)}{file.width ? ` · ${file.width}×${file.height}px` : ""} · {file.status}</span>{file.error && <span role="alert" className="block text-xs text-red-600 [[data-theme=dark]_&]:text-red-400">{file.error}</span>}</span>
      </button>
      <button type="button" disabled={busy} aria-label={`Remove ${file.name}`} onClick={() => onRemove(file.id)} className="size-11 shrink-0 cursor-pointer rounded-lg text-mute hover:bg-surface2 disabled:opacity-50">✕</button>
    </li>)}</ul>
  </section>;
}
