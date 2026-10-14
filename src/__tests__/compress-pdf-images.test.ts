import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFString, concatTransformationMatrix, drawObject, popGraphicsState, pushGraphicsState } from "pdf-lib";
import { compressPdf } from "@/features/pdf-tools/lib/compress-pdf";
import { compressPdfImages } from "@/features/pdf-tools/lib/compress-pdf-images";
import { blobBytes } from "./pdf-test-utils";
import type { CompressLevel } from "@/types";

const key = (value: string) => PDFName.of(value);
const jpegBytes = (size = 100) => { const bytes = new Uint8Array(size).fill(7); bytes.set([255, 216], 0); bytes.set([255, 217], size - 2); return bytes; };
async function fixture(width = 4000, height = 2000) {
  const document = await PDFDocument.create({ updateMetadata: false });
  const page = document.addPage([600, 800]); page.drawText("Selectable text remains intact");
  const image = document.context.stream(jpegBytes(10000), { Type: "XObject", Subtype: "Image", Width: width, Height: height, BitsPerComponent: 8, ColorSpace: "DeviceRGB", Filter: "DCTDecode" });
  const reference = document.context.register(image);
  page.node.Resources()?.set(key("XObject"), document.context.obj({ Im1: reference, Im2: reference }));
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(300, 0, 0, 150, 20, 50), drawObject("Im1"), popGraphicsState());
  const field = document.getForm().createTextField("test-field"); field.setText("Keep me"); field.addToPage(page);
  const link = document.context.register(document.context.obj({ Type: "Annot", Subtype: "Link", Rect: [20, 20, 100, 40], A: { S: "URI", URI: PDFString.of("https://example.com") } }));
  page.node.addAnnot(link);
  return { document, image, reference, link };
}

function mockCodec(width = 4000, height = 2000, size = 100) {
  const close = vi.fn();
  const decode = vi.fn(async () => ({ width, height, close }));
  vi.stubGlobal("createImageBitmap", decode);
  const context = { drawImage: vi.fn(), putImageData: vi.fn(), imageSmoothingEnabled: false, imageSmoothingQuality: "low" };
  const canvases: HTMLCanvasElement[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function(this: HTMLCanvasElement) { canvases.push(this); return context as unknown as CanvasRenderingContext2D; });
  const encode = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, mime) => {
    const blob = new Blob([jpegBytes(size)], { type: mime });
    Object.defineProperty(blob, "arrayBuffer", { value: () => blobBytes(blob) }); callback(blob);
  });
  vi.stubGlobal("ImageData", class { constructor(public data: Uint8ClampedArray, public width: number, public height: number) {} });
  return { close, decode, context, encode, canvases };
}

describe("PDF embedded image compression", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it.each<[CompressLevel, number, number, number]>([["low", 0.9, 3200, 1600], ["medium", 0.75, 2200, 1100], ["high", 0.55, 1400, 700]])("uses %s quality/dimensions and processes a shared reference once", async (level, quality, width, height) => {
    const { document, reference } = await fixture(); const codec = mockCodec();
    const stats = await compressPdfImages(document, level);
    expect(codec.encode).toHaveBeenCalledOnce(); expect(codec.encode.mock.calls[0].slice(1)).toEqual(["image/jpeg", quality]);
    expect(codec.context.drawImage.mock.calls[0].slice(1)).toEqual([0, 0, width, height]);
    const image = document.context.lookup(reference) as PDFRawStream;
    expect(image.dict.lookup(key("Width"), PDFNumber).asNumber()).toBe(width);
    expect(image.dict.lookup(key("Height"), PDFNumber).asNumber()).toBe(height);
    expect(image.contents).toEqual(jpegBytes());
    expect(stats).toEqual({ level, imagesFound: 1, imagesSupported: 1, imagesCompressed: 1, imagesSkipped: 0 });
    expect(codec.close).toHaveBeenCalledOnce(); expect(codec.canvases.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it("does not upscale small images", async () => {
    const { document } = await fixture(400, 200); const codec = mockCodec(400, 200);
    await compressPdfImages(document, "high");
    expect(codec.context.drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 400, 200]);
  });

  it.each(["larger", "decode-error", "encode-error", "invalid-jpeg", "size-mismatch"])("keeps the original stream after %s", async failure => {
    const { document, reference, image } = await fixture();
    const codec = mockCodec(failure === "size-mismatch" ? 3000 : 4000, 2000, failure === "larger" ? 12000 : 100);
    if (failure === "decode-error") codec.decode.mockRejectedValueOnce(new Error("bad JPEG"));
    if (failure === "encode-error") codec.encode.mockImplementationOnce(callback => callback(null));
    if (failure === "invalid-jpeg") codec.encode.mockImplementationOnce(callback => { const blob = new Blob(["not JPEG"], { type: "image/jpeg" }); Object.defineProperty(blob, "arrayBuffer", { value: () => blobBytes(blob) }); callback(blob); });
    const stats = await compressPdfImages(document, "high");
    expect(document.context.lookup(reference)).toBe(image);
    expect(stats.imagesCompressed).toBe(0); expect(stats.imagesSkipped).toBe(1);
    expect(codec.canvases.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    if (failure !== "decode-error") expect(codec.close).toHaveBeenCalledOnce();
  });

  it.each(["SMask", "Mask", "ImageMask", "Decode", "DecodeParms", "CMYK", "ICC", "Indexed", "JPEG2000", "oversized", "too-many-pixels"])("leaves %s images unchanged", async condition => {
    const { document, image, reference } = await fixture(); const codec = mockCodec();
    if (["SMask", "Mask", "ImageMask", "Decode", "DecodeParms"].includes(condition)) image.dict.set(key(condition), (condition === "ImageMask" ? document.context.obj(true) : document.context.obj({})));
    if (condition === "CMYK") image.dict.set(key("ColorSpace"), key("DeviceCMYK"));
    if (condition === "ICC") image.dict.set(key("ColorSpace"), document.context.obj(["ICCBased", {}]));
    if (condition === "Indexed") image.dict.set(key("ColorSpace"), document.context.obj(["Indexed", "DeviceRGB", 0, "palette"]));
    if (condition === "JPEG2000") image.dict.set(key("Filter"), key("JPXDecode"));
    if (condition === "oversized") image.dict.set(key("Width"), PDFNumber.of(8193));
    if (condition === "too-many-pixels") { image.dict.set(key("Width"), PDFNumber.of(8192)); image.dict.set(key("Height"), PDFNumber.of(8192)); }
    const stats = await compressPdfImages(document, "medium");
    expect(document.context.lookup(reference)).toBe(image); expect(codec.encode).not.toHaveBeenCalled();
    expect(stats.imagesSupported).toBe(0); expect(stats.imagesSkipped).toBe(1);
  });

  it("does not compress standalone grayscale images used as soft masks", async () => {
    const { document, image } = await fixture(); const codec = mockCodec();
    const mask = document.context.flateStream(new Uint8Array(12), { Type: "XObject", Subtype: "Image", Width: 4, Height: 3, BitsPerComponent: 8, ColorSpace: "DeviceGray" });
    const reference = document.context.register(mask); image.dict.set(key("SMask"), reference);
    const stats = await compressPdfImages(document, "high");
    expect(stats).toMatchObject({ imagesFound: 2, imagesCompressed: 0, imagesSkipped: 2, imagesSupported: 0 });
    expect(codec.encode).not.toHaveBeenCalled(); expect(document.context.lookup(reference)).toBe(mask);
  });

  it.each(["DeviceRGB", "DeviceGray"])("encodes raw/Flate %s pixels and releases source canvases", async colorSpace => {
    const { document, reference } = await fixture(100, 100); const codec = mockCodec();
    const channels = colorSpace === "DeviceRGB" ? 3 : 1;
    const pixels = new Uint8Array(100 * 100 * channels); for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 97 + (i >> 3)) % 256;
    document.context.assign(reference, document.context.flateStream(pixels, { Type: "XObject", Subtype: "Image", Width: 100, Height: 100, BitsPerComponent: 8, ColorSpace: colorSpace }));
    const stats = await compressPdfImages(document, "high");
    expect(stats.imagesCompressed).toBe(1); expect(codec.decode).not.toHaveBeenCalled();
    const data = codec.context.putImageData.mock.calls[0][0] as ImageData;
    expect(Array.from(data.data.slice(0, 4))).toEqual([pixels[0], pixels[channels === 3 ? 1 : 0], pixels[channels === 3 ? 2 : 0], 255]);
    expect(codec.canvases).toHaveLength(2); expect(codec.canvases.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it("preserves page content, forms, links and geometry through the actual PDF pipeline", async () => {
    const { document, reference, link } = await fixture(); mockCodec();
    const original = await document.save({ useObjectStreams: false });
    const source = await PDFDocument.load(original, { updateMetadata: false });
    const file = new File([new Uint8Array(original)], "images.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => new Uint8Array(original).buffer });
    const result = await compressPdf(file, { level: "high" });
    const output = await PDFDocument.load(await blobBytes(result.outputBlob), { updateMetadata: false });
    expect(result.outputSize).toBeLessThan(file.size); expect(result.compression?.imagesCompressed).toBe(1);
    expect(output.getPage(0).getSize()).toEqual(source.getPage(0).getSize());
    expect(output.getForm().getTextField("test-field").getText()).toBe("Keep me");
    expect(output.getPage(0).node.Annots()?.toString()).toBe(source.getPage(0).node.Annots()?.toString());
    expect(output.context.lookup(link)?.toString()).toBe(source.context.lookup(link)?.toString());
    const contents = source.getPage(0).node.Contents();
    expect(output.getPage(0).node.Contents()?.toString()).toBe(contents?.toString());
    for (const [ref, object] of source.context.enumerateIndirectObjects()) {
      if (object instanceof PDFRawStream && ref.toString() !== reference.toString()) expect((output.context.lookup(ref) as PDFRawStream).contents).toEqual(object.contents);
    }
    expect(output.context.lookup(reference)).toBeInstanceOf(PDFRawStream);
    const resources = output.getPage(0).node.Resources()?.lookup(key("XObject"));
    expect(resources?.toString()).toContain(reference.toString());
  });
});
