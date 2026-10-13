import { PDFDocument } from "pdf-lib";
import { parsePdfRanges, splitPdfByRanges } from "@/features/pdf-tools/lib/split-pdf";
import { blobBytes, pdfFile } from "./pdf-test-utils";

describe("split PDF", () => {
  it("preserves input order and removes repeated pages", () => {
    expect(parsePdfRanges("5, 1-3, 3", 5)).toEqual([4, 0, 1, 2]);
    expect(parsePdfRanges(" 2 - 4 , 1 ", 5)).toEqual([1, 2, 3, 0]);
  });
  it.each(["", " ", "0", "-1", "3-1", "6", "1-6", "1.5", "1,,2", "1,", "a", "1-", "1-2-3", "1e2", "9007199254740993"])("rejects invalid input %j", ranges => {
    expect(() => parsePdfRanges(ranges, 5)).toThrow();
  });
  it("extracts real pages with the documented result shape", async () => {
    const file = await pdfFile("REPORT.PDF");
    const result = await splitPdfByRanges(file, { ranges: "5,1-3,3" });
    const output = await PDFDocument.load(await blobBytes(result.outputBlob));
    expect(output.getPages().map(page => page.getWidth())).toEqual([500, 100, 200, 300]);
    expect(result).toMatchObject({ operation: "split", outputFileName: "REPORT-split.pdf", originalSize: file.size, outputSize: result.outputBlob.size });
    expect(result.outputBlob.type).toBe("application/pdf");
  });
  it("rejects invalid selections through the processing function", async () => {
    await expect(splitPdfByRanges(await pdfFile(), { ranges: "8" })).rejects.toThrow("1 to 5");
  });
});
