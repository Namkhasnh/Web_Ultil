import { PDFDocument } from "pdf-lib";
import type { PDFProcessResult, PDFSplitOptions } from "../types";
import { loadPdf, PdfToolError } from "./pdf-validation";
import { createPdfResult } from "./pdf-result";

export function parsePdfRanges(ranges: string, pageCount: number): number[] {
  if (!ranges.trim()) throw new PdfToolError("Enter page numbers or ranges, such as 1-3,5.");
  const selected = new Set<number>();
  for (const token of ranges.split(",")) {
    const match = token.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match) throw new PdfToolError("Invalid page range. Use page numbers or ranges, such as 1-3,5.");
    const start = Number(match[1]); const end = Number(match[2] ?? match[1]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end > pageCount) {
      throw new PdfToolError(`Choose pages from 1 to ${pageCount}, with ranges in ascending order.`);
    }
    for (let page = start; page <= end; page++) selected.add(page - 1);
  }
  return [...selected];
}

export async function splitPdfByRanges(file: File, options: PDFSplitOptions): Promise<PDFProcessResult> {
  const source = await loadPdf(file);
  const indices = parsePdfRanges(options.ranges, source.getPageCount());
  try {
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indices);
    pages.forEach(page => output.addPage(page));
    const name = file.name.replace(/\.pdf$/i, "") || "document";
    return createPdfResult(await output.save(), "split", `${name}-split.pdf`, file.size);
  } catch {
    throw new PdfToolError("Could not split this PDF. Try another file.");
  }
}
