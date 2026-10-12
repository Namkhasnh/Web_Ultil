// Browser boundaries are mocked in jsdom; the real pipeline stays under test.
export function mockImageBrowser() {
  let counter = 0;
  vi.stubGlobal("Image", class {
    naturalWidth = 400;
    naturalHeight = 200;
    onload?: () => void;
    onerror?: () => void;
    set src(value: string) { queueMicrotask(() => value.includes("corrupt") ? this.onerror?.() : this.onload?.()); }
  });
  const createUrl = vi.fn((blob: Blob) => `blob:${blob instanceof File && blob.name.includes("corrupt") ? "corrupt" : ++counter}`);
  const revokeUrl = vi.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: createUrl });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: revokeUrl });
  const context = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: "", createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), fillText: vi.fn(), font: "" };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const encode = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, mime) => queueMicrotask(() => callback(new Blob(["encoded"], { type: mime }))));
  return { createUrl, revokeUrl, context, encode };
}
export function imageFile(name = "photo.png", type = "image/png"): File {
  return new File(["a small image fixture"], name, { type });
}
