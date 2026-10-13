import { PDFArray, PDFDocument, PDFName, PDFObject, PDFRawStream, PDFRef, decodePDFRawStream } from "pdf-lib";
import { compressPdf } from "@/features/pdf-tools/lib/compress-pdf";
import { MAX_PDF_SIZE } from "@/features/pdf-tools/lib/pdf-validation";
import type { CompressLevel } from "@/types";
import { blobBytes, compressionPdfFile, pdfFile } from "./pdf-test-utils";

function fileFromBytes(bytes: Uint8Array, name = "report.pdf"): File {
  const file = new File([new Uint8Array(bytes)], name, { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => new Uint8Array(bytes).buffer });
  return file;
}

function rawStream(document: PDFDocument, object: PDFObject | undefined): PDFRawStream {
  const stream = document.context.lookup(object);
  if (!(stream instanceof PDFRawStream)) throw new Error("Expected a PDF stream in the fixture");
  return stream;
}

function pageContent(document: PDFDocument): number[][][] {
  return document.getPages().map(page => {
    const contents = page.node.lookup(PDFName.of("Contents"));
    if (!contents) return [];
    const streams = contents instanceof PDFArray ? contents.asArray() : [contents];
    return streams.map(stream => Array.from(decodePDFRawStream(rawStream(document, stream)).decode()));
  });
}

describe("compress PDF", () => {
  it.each<CompressLevel>(["low", "medium", "high"])("compresses a real PDF with %s and returns the standard result", async level => {
    const input = await compressionPdfFile("REPORT.PDF");
    const result = await compressPdf(input, { level });
    const output = await PDFDocument.load(await blobBytes(result.outputBlob), { updateMetadata: false });
    const source = await PDFDocument.load(await input.arrayBuffer(), { updateMetadata: false });
    expect(result.outputSize).toBeLessThan(input.size);
    expect(result).toMatchObject({ operation: "compress", outputFileName: "REPORT-compressed.pdf", originalSize: input.size, outputSize: result.outputBlob.size });
    expect(result.outputBlob.type).toBe("application/pdf");
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
    expect(output.getPages().map(page => page.getSize())).toEqual(source.getPages().map(page => page.getSize()));
    expect(pageContent(output)).toEqual(pageContent(source));
    expect(output.getTitle()).toBe(level === "low" ? "A document with metadata" : undefined);
  });

  it.each<CompressLevel>(["low", "medium", "high"])("handles XMP metadata correctly for %s", async level => {
    const input = await compressionPdfFile();
    const document = await PDFDocument.load(await input.arrayBuffer(), { updateMetadata: false });
    const metadata = document.context.register(document.context.stream("<x:xmpmeta>" + "x".repeat(5000) + "</x:xmpmeta>", { Type: "Metadata", Subtype: "XML" }));
    document.catalog.set(PDFName.of("Metadata"), metadata);
    const file = fileFromBytes(await document.save({ useObjectStreams: false }));
    const result = await compressPdf(file, { level });
    const output = await PDFDocument.load(await blobBytes(result.outputBlob), { updateMetadata: false });
    expect(output.catalog.has(PDFName.of("Metadata"))).toBe(level !== "high");
    if (level === "high") expect(output.context.lookup(metadata)).toBeUndefined();
    else expect(rawStream(output, output.catalog.get(PDFName.of("Metadata"))).getContents()).toEqual(rawStream(document, metadata).getContents());
  });

  it("preserves shared metadata objects and image/text/form content", async () => {
    const document = await PDFDocument.create({ updateMetadata: false });
    document.setTitle("Shared title");
    const info = document.context.trailerInfo.Info as PDFRef;
    document.catalog.set(PDFName.of("SharedInfo"), info);
    const metadata = document.context.register(document.context.stream("shared metadata", { Type: "Metadata", Subtype: "XML" }));
    document.catalog.set(PDFName.of("Metadata"), metadata);
    document.catalog.set(PDFName.of("SharedMetadata"), metadata);
    const image = await document.embedPng("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=");
    const page = document.addPage([400, 600]);
    page.drawText("Selectable text stays text");
    page.drawImage(image, { x: 20, y: 20, width: 30, height: 30 });
    const field = document.getForm().createTextField("name");
    field.setText("Original value"); field.addToPage(page);
    for (let index = 0; index < 20; index++) document.addPage();
    const file = fileFromBytes(await document.save({ useObjectStreams: false }));
    const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
    const result = await compressPdf(file, { level: "high" });
    const output = await PDFDocument.load(await blobBytes(result.outputBlob), { updateMetadata: false });
    expect(result.outputSize).toBeLessThan(file.size);
    expect(output.getForm().getTextField("name").getText()).toBe("Original value");
    expect(pageContent(output)).toEqual(pageContent(source));
    expect(rawStream(output, image.ref).getContents()).toEqual(rawStream(source, image.ref).getContents());
    expect(output.catalog.has(PDFName.of("Metadata"))).toBe(false);
    expect(rawStream(output, metadata).getContentsString()).toBe("shared metadata");
    expect(output.context.lookup(info)).toBeDefined();
  });

  it("returns identical original bytes if rewriting does not reduce size", async () => {
    const input = await pdfFile();
    const bytes = await input.arrayBuffer();
    const result = await compressPdf(input, { level: "low" });
    expect(result.outputSize).toBe(input.size);
    expect(new Uint8Array(await blobBytes(result.outputBlob))).toEqual(new Uint8Array(bytes));
  });

  it("reports an actionable error when serialization fails", async () => {
    const save = vi.spyOn(PDFDocument.prototype, "save");
    const input = await pdfFile();
    save.mockRejectedValueOnce(new Error("internal serialization error"));
    try {
      await expect(compressPdf(input, { level: "medium" })).rejects.toThrow("Could not compress this PDF. Try another file.");
    } finally { save.mockRestore(); }
  });

  it("rejects invalid levels and invalid, empty, oversized, corrupt or encrypted files", async () => {
    const valid = await pdfFile();
    await expect(compressPdf(valid, { level: "invalid" as CompressLevel })).rejects.toThrow("Choose Light");
    await expect(compressPdf(new File([], "empty.pdf", { type: "application/pdf" }), { level: "medium" })).rejects.toThrow("empty");
    await expect(compressPdf(new File(["x"], "bad.txt", { type: "text/plain" }), { level: "medium" })).rejects.toThrow("upload a PDF");
    const oversized = await pdfFile(); Object.defineProperty(oversized, "size", { value: MAX_PDF_SIZE + 1 });
    await expect(compressPdf(oversized, { level: "medium" })).rejects.toThrow("20 MiB");
    await expect(compressPdf(fileFromBytes(new TextEncoder().encode("bad")), { level: "medium" })).rejects.toThrow("Cannot read");
    const document = await PDFDocument.create(); document.addPage();
    document.context.trailerInfo.Encrypt = document.context.register(document.context.obj({ Filter: "Standard" }));
    await expect(compressPdf(fileFromBytes(await document.save()), { level: "medium" })).rejects.toThrow("encrypted");
  });
});
