"use client";

import { useRef, useState } from "react";

type Props = {
  label: string;
  title: string;
  icon: string;
  accept: string;
  formats: string;
  hint: string;
  accent: "image" | "pdf";
  multiple: boolean;
  busy: boolean;
  onAdd: (files: File[]) => Promise<void>;
};

export function FileDropZone({ label, title, icon, accept, formats, hint, accent, multiple, busy, onAdd }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const colors = accent === "image"
    ? { focus: "focus-visible:outline-[#3B6EF6]", active: "border-[#3B6EF6] bg-[#3B6EF6]/10", hover: "hover:border-[#3B6EF6]/50", text: "text-[#3B6EF6]" }
    : { focus: "focus-visible:outline-[#FF5470]", active: "border-[#FF5470] bg-[#FF5470]/10", hover: "hover:border-[#FF5470]/50", text: "text-[#FF5470]" };
  return <>
    <input ref={input} aria-label={label} type="file" multiple={multiple} accept={accept} disabled={busy} className="sr-only" onChange={event => { void onAdd(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) void onAdd(Array.from(event.dataTransfer.files)); }} className={`w-full cursor-pointer rounded-[18px] border-2 border-dashed px-5 py-8 text-center transition-colors focus-visible:outline-2 disabled:cursor-wait ${colors.focus} ${dragging ? colors.active : `border-border bg-surface ${colors.hover}`}`}>
      <span aria-hidden="true" className="block text-[34px]">{icon}</span><span className="mt-2.5 block font-heading text-[17px] font-bold">{title}</span>
      <span className="mt-1.5 block text-sm text-soft">or <span className={`font-semibold ${colors.text}`}>browse</span> · {formats}</span><span className="mt-2 block text-xs text-mute">{hint}</span>
    </button>
  </>;
}
