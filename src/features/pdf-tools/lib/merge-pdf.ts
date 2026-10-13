import { PDFDocument } from "pdf-lib";
import type { PDFProcessResult } from "../types";
import { loadPdf, PdfToolError } from "./pdf-validation";
import { createPdfResult } from "./pdf-result";

export async function mergePdfFiles(files: File[]): Promise<PDFProcessResult> {
  if (files.length < 2) throw new PdfToolError("Add at least two PDF files to merge.");
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await loadPdf(file);
    try {
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach(page => output.addPage(page));
    } catch { throw new PdfToolError("Could not merge these PDFs. Try different files."); }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  try {
    return createPdfResult(await output.save(), "merge", "merged.pdf", files.reduce((sum, file) => sum + file.size, 0));
  } catch {
    throw new PdfToolError("Could not merge these PDFs. Try different files.");
  }
}
