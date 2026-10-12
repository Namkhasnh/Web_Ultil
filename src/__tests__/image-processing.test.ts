import { compressImage, compressionLevel, convertImage, resizeDimensions, resizeImage, validateDimensions, validateImageFile, validateQuality } from "@/features/image-tools/lib/image-processing";
import { sizeChange } from "@/features/image-tools/components/ImagePreview";
import { imageFile, mockImageBrowser } from "./image-test-utils";

describe("image validation and dimensions", () => {
  it("accepts supported types and rejects empty, oversized and unsupported files", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) expect(validateImageFile(imageFile("photo", type))).toBe(type);
    expect(() => validateImageFile(new File([], "empty.png", { type: "image/png" }))).toThrow("empty");
    expect(() => validateImageFile(imageFile("x.gif", "image/gif"))).toThrow("PNG");
    const file = imageFile(); Object.defineProperty(file, "size", { value: 20 * 1048576 + 1 });
    expect(() => validateImageFile(file)).toThrow("20 MiB");
  });
  it("resizes using each original ratio, height, unlocked dimensions or percentage", () => {
    expect(resizeDimensions(400, 200, { width: 100, maintainAspectRatio: true })).toEqual({ width: 100, height: 50 });
    expect(resizeDimensions(200, 400, { width: 100, maintainAspectRatio: true })).toEqual({ width: 100, height: 200 });
    expect(resizeDimensions(400, 200, { height: 80, maintainAspectRatio: true })).toEqual({ width: 160, height: 80 });
    expect(resizeDimensions(400, 200, { width: 50, height: 90, maintainAspectRatio: false })).toEqual({ width: 50, height: 90 });
    expect(resizeDimensions(400, 200, { scalePercent: 25, maintainAspectRatio: true })).toEqual({ width: 100, height: 50 });
    expect(resizeDimensions(400, 200, { scalePercent: 0.01, maintainAspectRatio: true })).toEqual({ width: 1, height: 1 });
  });
  it("rejects invalid values and unsafe canvas dimensions", () => {
    for (const value of [0, -1, 1.5, NaN, Infinity]) expect(() => validateDimensions(value, 100)).toThrow();
    expect(() => validateDimensions(8193, 1)).toThrow("8192");
    expect(() => validateDimensions(8192, 8192)).toThrow("40 megapixels");
    expect(() => resizeDimensions(400, 200, { maintainAspectRatio: true })).toThrow("Enter");
    expect(() => resizeDimensions(400, 200, { scalePercent: 0, maintainAspectRatio: true })).toThrow("percentage");
    expect(() => resizeDimensions(400, 200, { width: 0, maintainAspectRatio: true })).toThrow("positive");
    for (const value of [-0.1, 1.1, NaN]) expect(() => validateQuality(value)).toThrow();
    validateQuality(0); validateQuality(1);
    expect([0.5, 0.6, 0.89, 0.9].map(compressionLevel)).toEqual(["high", "medium", "medium", "low"]);
  });
  it("reports actual savings and larger outputs", () => {
    expect(sizeChange(100, 60)).toBe("saved 40.0%");
    expect(sizeChange(100, 130)).toBe("30.0% larger");
  });
});
describe("image processing pipeline", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("returns a resize result with real blob metadata and releases decode URLs", async () => {
    const browser = mockImageBrowser(); const file = imageFile();
    const result = await resizeImage(file, { width: 100, maintainAspectRatio: true });
    expect(result).toMatchObject({ operation: "resize", outputFileName: "photo-resize.png", outputFormat: "png", width: 100, height: 50, originalSize: file.size, outputSize: 7 });
    expect(result.outputBlob.type).toBe("image/png"); expect(Date.parse(result.createdAt)).not.toBeNaN();
    expect(browser.revokeUrl).toHaveBeenCalledWith("blob:1");
  });
  it.each(["png", "jpeg", "webp"] as const)("converts to %s without resizing", async outputFormat => {
    const browser = mockImageBrowser(); const result = await convertImage(imageFile(), { outputFormat });
    expect(result).toMatchObject({ operation: "convert", width: 400, height: 200, outputFormat });
    expect(result.outputBlob.type).toBe(`image/${outputFormat}`);
    if (outputFormat === "jpeg") { expect(browser.context.fillStyle).toBe("#ffffff"); expect(browser.context.fillRect).toHaveBeenCalledBefore(browser.context.drawImage); expect(result.outputFileName).toBe("photo-convert.jpg"); }
  });
  it("compresses WebP using selected quality", async () => {
    const browser = mockImageBrowser(); const result = await compressImage(imageFile("photo.webp", "image/webp"), { quality: 0.8, level: "medium" });
    expect(result.outputFormat).toBe("webp"); expect(browser.encode).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.8);
    await expect(compressImage(imageFile(), { quality: 2, level: "medium" })).rejects.toThrow("Quality");
    await expect(convertImage(imageFile(), { outputFormat: "png", quality: 2 })).rejects.toThrow("Quality");
  });
  it.each([
    ["photo.jpg", "image/jpeg", "jpeg", "jpg"],
    ["photo.jpeg", "image/jpeg", "jpeg", "jpeg"],
    ["photo.png", "image/png", "png", "png"],
    ["photo.webp", "image/webp", "webp", "webp"],
  ] as const)("compress and resize preserve %s format, MIME and extension", async (name, mime, format, extension) => {
    const browser = mockImageBrowser(); const file = imageFile(name, mime);
    const compressed = await compressImage(file, { quality: 0.94, level: "low" });
    expect(compressed).toMatchObject({ outputFileName: `photo-compress.${extension}`, outputFormat: format, width: 400, height: 200 });
    expect(compressed.outputBlob.type).toBe(mime);
    expect(browser.encode).toHaveBeenLastCalledWith(expect.any(Function), mime, format === "png" ? undefined : 0.94);
    const resized = await resizeImage(file, { width: 100, maintainAspectRatio: true });
    expect(resized).toMatchObject({ outputFileName: `photo-resize.${extension}`, outputFormat: format, width: 100, height: 50 });
    expect(resized.outputBlob.type).toBe(mime);
  });
  it.each(["image/png", "image/jpeg", "image/webp"])("convert honors all selected formats for %s input", async mime => {
    mockImageBrowser();
    for (const format of ["png", "jpeg", "webp"] as const) {
      const result = await convertImage(imageFile("source.jpg", mime), { outputFormat: format });
      expect(result.outputFormat).toBe(format);
      expect(result.outputBlob.type).toBe(`image/${format}`);
      expect(result.outputFileName).toBe(`source-convert.${format === "jpeg" ? "jpg" : format}`);
    }
  });
  it("rejects corrupt input, null blobs and silent format fallback", async () => {
    const browser = mockImageBrowser();
    await expect(convertImage(imageFile("corrupt.png"), { outputFormat: "png" })).rejects.toThrow("Cannot read");
    browser.encode.mockImplementation(callback => callback(null));
    await expect(convertImage(imageFile(), { outputFormat: "png" })).rejects.toThrow("Could not create");
    browser.encode.mockImplementation(callback => callback(new Blob(["x"], { type: "image/png" })));
    await expect(convertImage(imageFile(), { outputFormat: "webp" })).rejects.toThrow("cannot export WEBP");
    expect(browser.revokeUrl).toHaveBeenCalledTimes(3);
  });
  it("reports a missing Canvas context", async () => {
    mockImageBrowser(); vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await expect(convertImage(imageFile(), { outputFormat: "png" })).rejects.toThrow("does not support Canvas");
  });
});
