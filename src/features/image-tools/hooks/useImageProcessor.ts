"use client";

import { useEffect, useRef, useState } from "react";
import type { FileProcessingStatus } from "@/types";
import { compressionLevel, compressImage, convertImage, createSampleImage, decodeImage, resizeImage, validateImageFile } from "../lib/image-processing";
import type { ImageFile, ImageOutput, ImageSettings } from "../types";

export const defaultImageSettings: ImageSettings = { operation: "resize", resizeMode: "pixels", width: "1280", height: "720", scalePercent: "100", maintainAspectRatio: true, lastDimension: "width", outputFormat: "webp", quality: 0.8 };
function message(error: unknown): string { return error instanceof Error ? error.message : "Could not process this image. Try another file."; }

export function useImageProcessor() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [outputs, setOutputs] = useState<ImageOutput[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [settings, setSettings] = useState<ImageSettings>(defaultImageSettings);
  const [status, setStatus] = useState<FileProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const urls = useRef(new Set<string>());
  const locked = useRef(false);
  const mounted = useRef(true);
  const generation = useRef({ value: 0 });
  useEffect(() => {
    mounted.current = true;
    const ownedUrls = urls.current;
    const lifecycle = generation.current;
    return () => { mounted.current = false; lifecycle.value++; for (const url of ownedUrls) URL.revokeObjectURL(url); ownedUrls.clear(); };
  }, []);
  function track(blob: Blob): string { const url = URL.createObjectURL(blob); urls.current.add(url); return url; }
  function release(url?: string) { if (url && urls.current.delete(url)) URL.revokeObjectURL(url); }
  function clearResults() {
    outputs.forEach(output => release(output.previewUrl));
    setOutputs([]); setProgress(0); setError("");
    setFiles(previous => previous.map(file => file.width ? { ...file, status: "ready", error: undefined } : file));
    setStatus(files.some(file => file.width) ? "ready" : files.length ? "error" : "idle");
  }
  function updateSettings(patch: Partial<ImageSettings>) { if (locked.current) return; clearResults(); setSettings(previous => ({ ...previous, ...patch })); }
  async function addFiles(incoming: File[]) {
    if (locked.current || !incoming.length) return;
    locked.current = true; clearResults(); setStatus("validating");
    const token = generation.current.value;
    const records: ImageFile[] = incoming.map(file => ({ id: crypto.randomUUID(), file, name: file.name, size: file.size, type: file.type as ImageFile["type"], status: "validating" }));
    setFiles(previous => [...previous, ...records]);
    if (!selectedId) setSelectedId(records[0].id);
    for (const record of records) {
      try {
        record.type = validateImageFile(record.file);
        const image = await decodeImage(record.file);
        if (!mounted.current || token !== generation.current.value) return;
        record.width = image.naturalWidth; record.height = image.naturalHeight; record.previewUrl = track(record.file); record.status = "ready";
      } catch (caught) { record.status = "error"; record.error = message(caught); }
      if (!mounted.current || token !== generation.current.value) return;
      setFiles(previous => previous.map(file => file.id === record.id ? { ...record } : file));
    }
    locked.current = false;
    setStatus(records.some(file => file.width) || files.some(file => file.width) ? "ready" : "error");
  }
  async function addSample() {
    if (locked.current) return;
    locked.current = true; setStatus("validating");
    try {
      const sample = await createSampleImage();
      if (!mounted.current) return;
      locked.current = false; await addFiles([sample]);
    } catch (caught) { if (mounted.current) { setError(message(caught)); setStatus("error"); } }
    finally { locked.current = false; }
  }
  function removeFile(id: string) {
    if (locked.current) return;
    clearResults(); release(files.find(file => file.id === id)?.previewUrl);
    const remaining = files.filter(file => file.id !== id);
    setFiles(remaining.map(file => file.width ? { ...file, status: "ready", error: undefined } : file));
    if (id === selectedId) setSelectedId(remaining[0]?.id ?? "");
    setStatus(remaining.some(file => file.width) ? "ready" : remaining.length ? "error" : "idle");
  }
  async function process() {
    if (locked.current) return;
    const candidates = files.filter(file => file.width !== undefined);
    if (!candidates.length) { setError("Add a valid image first."); return; }
    locked.current = true; clearResults(); setStatus("processing");
    const token = generation.current.value;
    let completed = 0; let succeeded = 0;
    for (const file of candidates) {
      setFiles(previous => previous.map(item => item.id === file.id ? { ...item, status: "processing", error: undefined } : item));
      try {
        const result = settings.operation === "resize"
          ? await resizeImage(file.file, settings.resizeMode === "percentage"
            ? { scalePercent: Number(settings.scalePercent), maintainAspectRatio: true }
            : { maintainAspectRatio: settings.maintainAspectRatio, ...(settings.maintainAspectRatio ? { [settings.lastDimension]: Number(settings[settings.lastDimension]) } : { width: Number(settings.width), height: Number(settings.height) }) })
          : settings.operation === "convert"
            ? await convertImage(file.file, { outputFormat: settings.outputFormat, quality: 0.92 })
            : await compressImage(file.file, { quality: settings.quality, level: compressionLevel(settings.quality) });
        if (!mounted.current || token !== generation.current.value) return;
        const output = { id: file.id, result, previewUrl: track(result.outputBlob) };
        setOutputs(previous => [...previous, output]); succeeded++;
        setFiles(previous => previous.map(item => item.id === file.id ? { ...item, status: "done" } : item));
      } catch (caught) {
        if (!mounted.current || token !== generation.current.value) return;
        setFiles(previous => previous.map(item => item.id === file.id ? { ...item, status: "error", error: message(caught) } : item));
      }
      completed++; setProgress(Math.round(completed / candidates.length * 100));
      // Give the browser an opportunity to paint between files.
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!mounted.current || token !== generation.current.value) return;
    }
    locked.current = false; setStatus(succeeded ? "done" : "error");
  }
  return { files, outputs, selectedId, selectFile: setSelectedId, settings, updateSettings, status, progress, error, addFiles, addSample, removeFile, process, again: () => { if (!locked.current) clearResults(); }, busy: status === "processing" || status === "validating" };
}
