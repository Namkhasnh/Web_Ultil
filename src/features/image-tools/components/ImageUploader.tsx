"use client";

import Image from "next/image";
import { FileDropZone } from "@/components/common/FileDropZone";
import { formatFileSize } from "@/lib/format-file-size";
import type { ImageFile } from "../types";

type Props = { files: ImageFile[]; selectedId: string; busy: boolean; onAdd: (files: File[]) => Promise<void>; onSample: () => Promise<void>; onRemove: (id: string) => void; onSelect: (id: string) => void };
export function ImageUploader({ files, selectedId, busy, onAdd, onSample, onRemove, onSelect }: Props) {
  return <section aria-label="Image upload">
    <FileDropZone label="Choose images" title="Drop images here" icon="🖼️" accept="image/png,image/jpeg,image/webp" formats="JPG, PNG, WebP" hint="Up to 20 MiB per image · Files stay on your device" accent="image" multiple busy={busy} onAdd={onAdd} />
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
