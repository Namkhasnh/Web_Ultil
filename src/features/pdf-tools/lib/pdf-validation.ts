import { PDFDocument } from "pdf-lib";
import { validateFileSize } from "@/lib/file-validation";

export class PdfToolError extends Error {}

export const MAX_PDF_SIZE = 20 * 1048576;

export async function loadPdf(file: File, options: { updateMetadata?: boolean } = {}): Promise<PDFDocument> {
  try { validateFileSize(file, MAX_PDF_SIZE); }
  catch (error) { throw new PdfToolError(error instanceof Error ? error.message : "Choose a PDF up to 20 MiB."); }
  if (file.type !== "application/pdf" && !(file.type === "" && /\.pdf$/i.test(file.name))) {
    throw new PdfToolError("This file type is not supported. Please upload a PDF file.");
  }
  try {
    // Inspect the encryption flag before reading or copying any pages.
    const document = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, ...options });
    if (document.isEncrypted) throw new PdfToolError("This PDF is encrypted. Choose an unprotected PDF.");
    if (!document.getPageCount()) throw new PdfToolError("Cannot read this PDF. Choose a valid PDF with at least one page.");
    return document;
  } catch (error) {
    if (error instanceof PdfToolError) throw error;
    throw new PdfToolError("Cannot read this PDF. Choose a valid PDF with at least one page.");
  }
}

export function pdfErrorMessage(error: unknown): string {
  return error instanceof PdfToolError ? error.message : "Could not process this PDF. Try another file.";
}

export async function createSamplePdf(): Promise<File> {
  const document = await PDFDocument.create();
  for (let index = 1; index <= 5; index++) {
    document.addPage().drawText(`WebUtil sample - Page ${index}`, { x: 50, y: 700, size: 24 });
  }
  return new File([new Uint8Array(await document.save())], "webutil-sample.pdf", { type: "application/pdf" });
}
