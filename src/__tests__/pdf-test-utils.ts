import { PDFDocument } from "pdf-lib";

export async function pdfFile(name = "document.pdf", widths = [100, 200, 300, 400, 500]): Promise<File> {
  const document = await PDFDocument.create();
  widths.forEach(width => document.addPage([width, 600]));
  const bytes = new Uint8Array(await document.save());
  const file = new File([bytes], name, { type: "application/pdf" });
  // jsdom File lacks arrayBuffer; retain a real in-memory PDF payload.
  Object.defineProperty(file, "arrayBuffer", { configurable: true, value: async () => bytes.slice().buffer });
  return file;
}

export async function blobBytes(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export function installPdfFileReader(): void {
  const BrowserFile = File;
  vi.stubGlobal("File", class extends BrowserFile {
    arrayBuffer(): Promise<ArrayBuffer> { return blobBytes(this); }
  });
}

export async function compressionPdfFile(name = "report.pdf"): Promise<File> {
  const document = await PDFDocument.create({ updateMetadata: false });
  for (let index = 0; index < 10; index++) {
    document.addPage([300 + index, 600]).drawText(`Compression fixture page ${index + 1}`);
  }
  document.setTitle("A document with metadata");
  const bytes = new Uint8Array(await document.save({ useObjectStreams: false }));
  const file = new File([bytes], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", { configurable: true, value: async () => bytes.slice().buffer });
  return file;
}
