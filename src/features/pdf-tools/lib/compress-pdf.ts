import { PDFArray, PDFDict, PDFDocument, PDFObject, PDFRef, PDFStream, PDFName } from "pdf-lib";
import type { PDFCompressOptions, PDFProcessResult } from "../types";
import { createPdfResult } from "./pdf-result";
import { loadPdf, PdfToolError } from "./pdf-validation";

// Metadata can be shared with other PDF objects. Never remove a referenced object.
function deleteUnreferencedMetadata(document: PDFDocument, object: PDFObject | undefined): void {
  if (!(object instanceof PDFRef)) return;
  const metadataReference = object.toString();
  const visited = new Set<PDFObject>();
  function references(value: PDFObject): boolean {
    if (value instanceof PDFRef) return value.toString() === metadataReference;
    if (visited.has(value)) return false;
    visited.add(value);
    if (value instanceof PDFStream) return references(value.dict);
    if (value instanceof PDFDict) return value.values().some(references);
    if (value instanceof PDFArray) return value.asArray().some(references);
    return false;
  }
  const trailerReferences = Object.values(document.context.trailerInfo).some(value => value && references(value));
  if (!trailerReferences && !document.context.enumerateIndirectObjects().some(([, value]) => references(value))) {
    document.context.delete(object);
  }
}

export async function compressPdf(file: File, options: PDFCompressOptions): Promise<PDFProcessResult> {
  if (!["low", "medium", "high"].includes(options.level)) {
    throw new PdfToolError("Choose Light, Balanced, or Maximum compression.");
  }
  const document = await loadPdf(file, { updateMetadata: false });
  try {
    if (options.level !== "low") {
      const info = document.context.trailerInfo.Info;
      delete document.context.trailerInfo.Info;
      deleteUnreferencedMetadata(document, info);
    }
    if (options.level === "high") {
      const metadata = document.catalog.get(PDFName.of("Metadata"));
      document.catalog.delete(PDFName.of("Metadata"));
      deleteUnreferencedMetadata(document, metadata);
    }
    const bytes = await document.save({ useObjectStreams: true, updateFieldAppearances: false, objectsPerTick: 25 });
    const output = bytes.length < file.size ? bytes : new Uint8Array(await file.arrayBuffer());
    const name = file.name.replace(/\.pdf$/i, "") || "document";
    return createPdfResult(output, "compress", `${name}-compressed.pdf`, file.size);
  } catch {
    throw new PdfToolError("Could not compress this PDF. Try another file.");
  }
}
