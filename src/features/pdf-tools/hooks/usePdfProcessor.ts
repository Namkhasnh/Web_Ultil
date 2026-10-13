"use client";

import { useEffect, useRef, useState } from "react";
import type { CompressLevel, FileProcessingStatus } from "@/types";
import type { PDFFile, PDFProcessResult, SupportedPDFOperation } from "../types";
import { createSamplePdf, loadPdf, pdfErrorMessage, PdfToolError } from "../lib/pdf-validation";
import { splitPdfByRanges } from "../lib/split-pdf";
import { compressPdf } from "../lib/compress-pdf";
import { mergePdfFiles } from "../lib/merge-pdf";

export function usePdfProcessor() {
  const [operation, setOperation] = useState<SupportedPDFOperation>("merge");
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [compressLevel, setCompressLevel] = useState<CompressLevel>("medium");
  const [ranges, setRanges] = useState("");
  const [result, setResult] = useState<PDFProcessResult | null>(null);
  const [status, setStatus] = useState<FileProcessingStatus>("idle");
  const [error, setError] = useState("");
  const locked = useRef(false);
  const generation = useRef({ value: 0 });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const lifecycle = generation.current;
    return () => { mounted.current = false; lifecycle.value++; };
  }, []);
  const active = (token: number) => mounted.current && token === generation.current.value;
  function invalidate(nextFiles = files) {
    setResult(null); setError("");
    setStatus(nextFiles.length ? nextFiles.some(file => file.error) ? "error" : "ready" : "idle");
    setFiles(nextFiles.map(file => ({ ...file, status: file.error ? "error" : "ready" })));
  }
  function reset(nextOperation = operation) {
    if (locked.current) return;
    generation.current.value++; setOperation(nextOperation); setRanges(""); invalidate([]);
  }
  async function validateIncoming(incoming: File[], token: number) {
    const records: PDFFile[] = incoming.map(file => ({ id: crypto.randomUUID(), file, name: file.name, size: file.size, type: "application/pdf", status: "validating" }));
    let combined = operation !== "merge" ? records : [...files, ...records];
    setFiles(combined);
    for (const record of records) {
      let updated: PDFFile;
      try { updated = { ...record, pageCount: (await loadPdf(record.file)).getPageCount(), status: "ready" }; }
      catch (caught) { updated = { ...record, error: pdfErrorMessage(caught), status: "error" }; }
      if (!active(token)) return;
      combined = combined.map(file => file.id === record.id ? updated : file);
      setFiles(combined);
    }
    if (active(token)) setStatus(combined.some(file => file.error) ? "error" : "ready");
  }
  async function addFiles(incoming: File[]) {
    if (locked.current || !incoming.length) return;
    if (operation !== "merge" && incoming.length !== 1) { setError(`Choose one PDF file to ${operation}.`); return; }
    locked.current = true; invalidate(); setStatus("validating");
    const token = generation.current.value;
    try { await validateIncoming(incoming, token); }
    finally { locked.current = false; }
  }
  async function addSample() {
    if (locked.current) return;
    locked.current = true; invalidate(); setStatus("validating");
    const token = generation.current.value;
    try {
      const file = await createSamplePdf();
      if (active(token)) await validateIncoming([file], token);
    } catch { if (active(token)) { setError("Could not create a sample PDF. Please choose a file."); setStatus("error"); } }
    finally { locked.current = false; }
  }
  function removeFile(id: string) { if (!locked.current) invalidate(files.filter(file => file.id !== id)); }
  function moveFile(id: string, direction: -1 | 1) {
    if (locked.current) return;
    const index = files.findIndex(file => file.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= files.length) return;
    const next = [...files]; [next[index], next[target]] = [next[target], next[index]]; invalidate(next);
  }
  function updateRanges(value: string) { if (!locked.current) { invalidate(); setRanges(value); } }
  function updateCompressLevel(value: CompressLevel) { if (!locked.current) { invalidate(); setCompressLevel(value); } }
  async function process() {
    if (locked.current) return;
    setResult(null); setError("");
    if (files.some(file => file.error)) { setError("Remove invalid files before processing."); setStatus("error"); return; }
    locked.current = true; setStatus("processing");
    setFiles(previous => previous.map(file => ({ ...file, status: "processing" })));
    const token = generation.current.value;
    try {
      // Allow the loading state to paint before PDF work starts.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!active(token)) return;
      if (operation !== "merge" && files.length !== 1) throw new PdfToolError(`Choose one PDF file to ${operation}.`);
      const output = operation === "merge"
        ? await mergePdfFiles(files.map(file => file.file))
        : operation === "split"
          ? await splitPdfByRanges(files[0].file, { ranges })
          : await compressPdf(files[0].file, { level: compressLevel });
      if (active(token)) { setResult(output); setStatus("done"); setFiles(previous => previous.map(file => ({ ...file, status: "done" }))); }
    } catch (caught) { if (active(token)) { setError(pdfErrorMessage(caught)); setStatus("error"); } }
    finally { locked.current = false; }
  }
  return { operation, files, ranges, compressLevel, updateCompressLevel, result, status, error, busy: status === "validating" || status === "processing", addFiles, addSample, removeFile, moveFile, updateRanges, changeOperation: reset, again: () => reset(), process };
}
