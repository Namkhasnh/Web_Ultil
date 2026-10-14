import { encodeCanvasBlob } from "@/lib/canvas-encoding";

describe("shared canvas encoding", () => {
  afterEach(() => vi.restoreAllMocks());
  it("passes the requested MIME and quality to Canvas", async () => {
    const blob = new Blob(["bytes"], { type: "image/jpeg" });
    const encode = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(blob));
    const canvas = document.createElement("canvas");
    await expect(encodeCanvasBlob(canvas, "image/jpeg", 0.55)).resolves.toBe(blob);
    expect(encode.mock.calls[0].slice(1)).toEqual(["image/jpeg", 0.55]);
  });
  it.each([NaN, -0.1, 1.1])("rejects invalid quality %s before encoding", quality => {
    expect(() => encodeCanvasBlob(document.createElement("canvas"), "image/jpeg", quality)).toThrow("Quality must be between 0 and 1");
  });
  it("rejects unsupported formats, null blobs and unsupported browser output", async () => {
    const canvas = document.createElement("canvas");
    expect(() => encodeCanvasBlob(canvas, "image/unknown")).toThrow("Choose PNG");
    const encode = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(null));
    await expect(encodeCanvasBlob(canvas, "image/jpeg")).rejects.toThrow("Could not create");
    encode.mockImplementation(callback => callback(new Blob(["x"], { type: "image/png" })));
    await expect(encodeCanvasBlob(canvas, "image/jpeg")).rejects.toThrow("cannot export JPEG");
    encode.mockImplementation(() => { throw new Error("browser error"); });
    await expect(encodeCanvasBlob(canvas, "image/jpeg")).rejects.toThrow("Image export failed");
  });
});
