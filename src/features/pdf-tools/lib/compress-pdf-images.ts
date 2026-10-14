import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFObject, PDFRawStream, PDFStream } from "pdf-lib";
import { encodeCanvasBlob } from "@/lib/canvas-encoding";
import type { CompressLevel } from "@/types";
import type { PDFCompressionStats } from "../types";

export const PDF_IMAGE_COMPRESSION: Record<CompressLevel, { quality: number; maxDimension: number }> = {
  low: { quality: 0.9, maxDimension: 3200 },
  medium: { quality: 0.75, maxDimension: 2200 },
  high: { quality: 0.55, maxDimension: 1400 },
};
const name = (key: string) => PDFName.of(key);

type ImageSpec = { width: number; height: number; channels: 1 | 3; jpeg: boolean };
function imageSpec(stream: PDFRawStream): ImageSpec | null {
  const dict = stream.dict;
  if (["SMask", "Mask", "ImageMask", "Decode", "DecodeParms", "SMaskInData", "Alternates", "OPI", "F"].some(key => dict.has(name(key)))) return null;
  const widthObject = dict.lookup(name("Width"));
  const heightObject = dict.lookup(name("Height"));
  const bits = dict.lookup(name("BitsPerComponent"));
  const colorSpace = dict.lookup(name("ColorSpace"));
  const filter = dict.lookup(name("Filter"));
  if (!(widthObject instanceof PDFNumber) || !(heightObject instanceof PDFNumber) || !(bits instanceof PDFNumber) || bits.asNumber() !== 8) return null;
  const width = widthObject.asNumber(), height = heightObject.asNumber();
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > 40000000) return null;
  if (colorSpace !== name("DeviceRGB") && colorSpace !== name("DeviceGray")) return null;
  if (filter && filter !== name("DCTDecode") && filter !== name("FlateDecode")) return null;
  return { width, height, channels: colorSpace === name("DeviceGray") ? 1 : 3, jpeg: filter === name("DCTDecode") };
}

// Soft masks themselves are ordinary grayscale images. Do not JPEG-encode them.
function maskObjects(document: PDFDocument): Set<PDFObject> {
  const masks = new Set<PDFObject>();
  const visited = new Set<PDFObject>();
  function visit(object: PDFObject): void {
    if (visited.has(object)) return;
    visited.add(object);
    if (object instanceof PDFStream) visit(object.dict);
    else if (object instanceof PDFDict) {
      for (const key of ["SMask", "Mask"]) {
        const mask = document.context.lookup(object.get(name(key)));
        if (mask) masks.add(mask);
      }
      object.values().forEach(visit);
    } else if (object instanceof PDFArray) object.asArray().forEach(visit);
  }
  document.context.enumerateIndirectObjects().forEach(([, object]) => visit(object));
  return masks;
}

async function encodeImage(stream: PDFRawStream, spec: ImageSpec, level: CompressLevel): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const preset = PDF_IMAGE_COMPRESSION[level];
  const scale = Math.min(1, preset.maxDimension / Math.max(spec.width, spec.height));
  const width = Math.max(1, Math.round(spec.width * scale));
  const height = Math.max(1, Math.round(spec.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  let bitmap: ImageBitmap | undefined;
  let sourceCanvas: HTMLCanvasElement | undefined;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (spec.jpeg) {
      bitmap = await createImageBitmap(new Blob([new Uint8Array(stream.contents)], { type: "image/jpeg" }), { imageOrientation: "none", colorSpaceConversion: "none" });
      if (bitmap.width !== spec.width || bitmap.height !== spec.height) throw new Error("Image dimensions do not match the PDF");
      context.drawImage(bitmap, 0, 0, width, height);
    } else {
      const expected = spec.width * spec.height * spec.channels;
      const pixels = decodePDFRawStream(stream).getBytes(expected + 1);
      if (pixels.length !== expected) throw new Error("Invalid image data length");
      const rgba = new Uint8ClampedArray(spec.width * spec.height * 4);
      for (let pixel = 0; pixel < spec.width * spec.height; pixel++) {
        const offset = pixel * spec.channels;
        rgba[pixel * 4] = pixels[offset];
        rgba[pixel * 4 + 1] = pixels[offset + (spec.channels === 3 ? 1 : 0)];
        rgba[pixel * 4 + 2] = pixels[offset + (spec.channels === 3 ? 2 : 0)];
        rgba[pixel * 4 + 3] = 255;
      }
      sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = spec.width; sourceCanvas.height = spec.height;
      const sourceContext = sourceCanvas.getContext("2d");
      if (!sourceContext) throw new Error("Canvas unavailable");
      sourceContext.putImageData(new ImageData(rgba, spec.width, spec.height), 0, 0);
      context.drawImage(sourceCanvas, 0, 0, width, height);
    }
    const blob = await encodeCanvasBlob(canvas, "image/jpeg", preset.quality);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) throw new Error("Invalid JPEG output");
    return { bytes, width, height };
  } finally {
    bitmap?.close();
    canvas.width = 0; canvas.height = 0;
    if (sourceCanvas) { sourceCanvas.width = 0; sourceCanvas.height = 0; }
  }
}

export async function compressPdfImages(document: PDFDocument, level: CompressLevel): Promise<PDFCompressionStats> {
  const stats: PDFCompressionStats = { level, imagesFound: 0, imagesCompressed: 0, imagesSkipped: 0, imagesSupported: 0 };
  const masks = maskObjects(document);
  for (const [reference, object] of document.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || object.dict.lookup(name("Subtype")) !== name("Image")) continue;
    stats.imagesFound++;
    try {
      const spec = masks.has(object) ? null : imageSpec(object);
      if (spec) {
        stats.imagesSupported++;
        const output = await encodeImage(object, spec, level);
        if (output.bytes.length < object.contents.length) {
          const dict = object.dict.clone(document.context);
          dict.set(name("Width"), PDFNumber.of(output.width));
          dict.set(name("Height"), PDFNumber.of(output.height));
          dict.set(name("ColorSpace"), name("DeviceRGB"));
          dict.set(name("Filter"), name("DCTDecode"));
          document.context.assign(reference, PDFRawStream.of(dict, output.bytes));
          stats.imagesCompressed++;
        }
      }
    } catch { /* Keep this image's original stream if its browser codec fails. */ }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  stats.imagesSkipped = stats.imagesFound - stats.imagesCompressed;
  return stats;
}
