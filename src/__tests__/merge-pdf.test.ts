import { PDFDocument, PDFName } from "pdf-lib";
import { mergePdfFiles } from "@/features/pdf-tools/lib/merge-pdf";
import { loadPdf, MAX_PDF_SIZE } from "@/features/pdf-tools/lib/pdf-validation";
import { blobBytes, pdfFile } from "./pdf-test-utils";

describe("merge PDF", () => {
  it("preserves page order and returns a real PDF result", async () => {
    const files = [await pdfFile("first.pdf", [123, 234]), await pdfFile("second.pdf", [345])];
    const result = await mergePdfFiles(files);
    const output = await PDFDocument.load(await blobBytes(result.outputBlob));
    expect(output.getPages().map(page => page.getWidth())).toEqual([123, 234, 345]);
    expect(result).toMatchObject({ operation: "merge", outputFileName: "merged.pdf", originalSize: files[0].size + files[1].size, outputSize: result.outputBlob.size });
    expect(result.outputBlob.type).toBe("application/pdf");
    expect(Number.isNaN(Date.parse(result.createdAt))).toBe(false);
  });
  it("requires two files and refuses partial output for corrupt inputs", async () => {
    const valid = await pdfFile();
    await expect(mergePdfFiles([valid])).rejects.toThrow("at least two");
    const corrupt = new File(["bad"], "bad.pdf", { type: "application/pdf" });
    Object.defineProperty(corrupt, "arrayBuffer", { value: async () => new TextEncoder().encode("bad").buffer });
    await expect(mergePdfFiles([valid, corrupt])).rejects.toThrow("Cannot read");
  });
  it("validates empty, oversized and unsupported files", async () => {
    await expect(loadPdf(new File([], "empty.pdf", { type: "application/pdf" }))).rejects.toThrow("empty");
    await expect(loadPdf(new File(["x"], "x.txt", { type: "text/plain" }))).rejects.toThrow("upload a PDF");
    const oversized = await pdfFile(); Object.defineProperty(oversized, "size", { value: MAX_PDF_SIZE + 1 });
    await expect(loadPdf(oversized)).rejects.toThrow("20 MiB");
  });
  it("rejects PDFs without pages and PDFs marked as encrypted", async () => {
    for (const encrypted of [false, true]) {
      const document = await PDFDocument.create();
      if (encrypted) {
        document.addPage();
        document.context.trailerInfo.Encrypt = document.context.register(document.context.obj({ Filter: PDFName.of("Standard") }));
      }
      const bytes = new Uint8Array(await document.save({ addDefaultPage: false }));
      const file = new File([bytes], "unsupported.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "arrayBuffer", { value: async () => bytes.slice().buffer });
      await expect(loadPdf(file)).rejects.toThrow(encrypted ? "encrypted" : "at least one page");
    }
  });
  it("accepts PDF filenames with missing MIME only when parsing succeeds", async () => {
    const source = await pdfFile(); const bytes = await source.arrayBuffer();
    const file = new File([bytes], "document.PDF");
    Object.defineProperty(file, "arrayBuffer", { value: async () => bytes });
    expect((await loadPdf(file)).getPageCount()).toBe(5);
  });

});
