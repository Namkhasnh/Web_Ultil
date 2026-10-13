import type { PDFProcessResult, SupportedPDFOperation } from "../types";

export function createPdfResult(bytes: Uint8Array, operation: SupportedPDFOperation, outputFileName: string, originalSize: number): PDFProcessResult {
  const outputBlob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  return { operation, outputFileName, outputBlob, originalSize, outputSize: outputBlob.size, createdAt: new Date().toISOString() };
}
