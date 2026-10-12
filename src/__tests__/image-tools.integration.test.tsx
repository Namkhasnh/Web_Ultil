import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageTools } from "@/features/image-tools";
import { useImageProcessor } from "@/features/image-tools/hooks/useImageProcessor";
import * as downloads from "@/lib/download";
import { imageFile, mockImageBrowser } from "./image-test-utils";

describe("image tools integration", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("uploads multiple files, continues after invalid files, processes and downloads", async () => {
    const browser = mockImageBrowser();
    const downloadUrls: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { downloadUrls.push(this.href); });
    const user = userEvent.setup({ applyAccept: false }); render(<ImageTools />);
    await user.upload(screen.getByLabelText("Choose images"), [imageFile(), imageFile("other.png"), imageFile("bad.gif", "image/gif")]);
    expect(await screen.findByRole("alert")).toHaveTextContent("PNG");
    await user.clear(screen.getByLabelText("Width")); await user.type(screen.getByLabelText("Width"), "100");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("status")).toHaveTextContent("2 images ready");
    expect(screen.getByText(/100 × 50px.*saved/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Download image/ })); expect(click).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /Download all/ })); await waitFor(() => expect(click).toHaveBeenCalledTimes(3));
    await user.click(screen.getByRole("button", { name: "Preview other.png" }));
    expect(screen.getByAltText("Processed other.png")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Again" })); expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview other.png" })).toBeInTheDocument();
    expect(browser.revokeUrl).toHaveBeenCalled();
    await waitFor(() => { for (const url of downloadUrls) expect(browser.revokeUrl).toHaveBeenCalledWith(url); }, { timeout: 2000 });
  });
  it("changes tools with keyboard and invalidates old results when settings change", async () => {
    mockImageBrowser(); const user = userEvent.setup(); render(<ImageTools />);
    await user.upload(screen.getByLabelText("Choose images"), imageFile());
    screen.getByRole("tab", { name: "Resize" }).focus(); await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Convert" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "PNG" }));
    await user.click(screen.getByRole("button", { name: "Apply" })); await screen.findByText(/✓ Done/);
    await user.click(screen.getByRole("button", { name: "JPG" })); expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Compress" }));
    fireEvent.change(screen.getByLabelText("Quality"), { target: { value: "60" } });
    await user.click(screen.getByRole("button", { name: "Apply" })); await screen.findByText(/✓ Done/);
    expect(screen.getByText(/400 × 200px · PNG/)).toBeInTheDocument();
  });
  it("runs percentage resize and removes previews with URL cleanup", async () => {
    const browser = mockImageBrowser(); const user = userEvent.setup(); const view = render(<ImageTools />);
    await user.upload(screen.getByLabelText("Choose images"), imageFile());
    await user.selectOptions(screen.getByLabelText("Resize by"), "percentage");
    await user.clear(screen.getByLabelText("Scale (%)")); await user.type(screen.getByLabelText("Scale (%)"), "25");
    await user.click(screen.getByRole("button", { name: "Apply" })); await screen.findByRole("status");
    expect(screen.getByText(/100 × 50px/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect(screen.queryByRole("button", { name: "Preview photo.png" })).not.toBeInTheDocument();
    view.unmount(); expect(browser.revokeUrl.mock.calls.map(call => call[0]).sort()).toEqual(browser.createUrl.mock.results.map(result => result.value).sort());
  });
  it("locks input during processing and exposes validating/ready/processing/done states", async () => {
    const browser = mockImageBrowser(); const { result } = renderHook(() => useImageProcessor());
    expect(result.current.status).toBe("idle");
    let upload: Promise<void>;
    act(() => { upload = result.current.addFiles([imageFile()]); });
    expect(result.current.status).toBe("validating");
    await act(async () => { await upload; }); expect(result.current.status).toBe("ready");
    let callback: BlobCallback | undefined;
    browser.encode.mockImplementation(next => { callback = next; });
    let processing: Promise<void>;
    act(() => { processing = result.current.process(); });
    expect(result.current.status).toBe("processing");
    act(() => result.current.updateSettings({ operation: "convert" })); expect(result.current.settings.operation).toBe("resize");
    await waitFor(() => expect(callback).toBeDefined());
    await act(async () => { callback?.(new Blob(["out"], { type: "image/png" })); await processing; });
    expect(result.current.status).toBe("done"); expect(result.current.progress).toBe(100);
  });
  it("shows error state when all files are corrupt and cleans up unmounted async work", async () => {
    const browser = mockImageBrowser(); const { result, unmount } = renderHook(() => useImageProcessor());
    await act(async () => { await result.current.addFiles([imageFile("corrupt.png")]); });
    expect(result.current.status).toBe("error"); expect(result.current.files[0].error).toContain("Cannot read");
    unmount(); expect(browser.revokeUrl).toHaveBeenCalledWith("blob:corrupt");
  });
  it("adds a local sample through the real upload pipeline", async () => {
    mockImageBrowser(); render(<ImageTools />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add a sample image" }));
    expect(await screen.findByRole("button", { name: "Preview webutil-sample.png" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled());
  });
  it("discards output completing after unmount without leaking a preview URL", async () => {
    const browser = mockImageBrowser(); const { result, unmount } = renderHook(() => useImageProcessor());
    await act(async () => { await result.current.addFiles([imageFile()]); });
    let callback: BlobCallback | undefined;
    browser.encode.mockImplementation(next => { callback = next; });
    let processing: Promise<void>;
    act(() => { processing = result.current.process(); });
    await waitFor(() => expect(callback).toBeDefined());
    unmount();
    await act(async () => { callback?.(new Blob(["out"], { type: "image/png" })); await processing; });
    expect(browser.createUrl).toHaveBeenCalledTimes(3);
    expect(browser.revokeUrl.mock.calls.map(call => call[0]).sort()).toEqual(browser.createUrl.mock.results.map(result => result.value).sort());
  });
  it.each(["Compress", "Resize", "Convert"])("%s downloads correct formats for a mixed batch", async tool => {
    mockImageBrowser();
    const download = vi.spyOn(downloads, "downloadBlob").mockImplementation(() => {});
    const user = userEvent.setup(); render(<ImageTools />);
    await user.upload(screen.getByLabelText("Choose images"), [imageFile("photo.jpg", "image/jpeg"), imageFile("transparent.png", "image/png"), imageFile("banner.webp", "image/webp")]);
    await user.click(screen.getByRole("tab", { name: tool }));
    if (tool === "Convert") await user.click(screen.getByRole("button", { name: "JPG" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByText(/✓ Done · 3 images ready/);
    const extensions = tool === "Convert" ? ["jpg", "jpg", "jpg"] : ["jpg", "png", "webp"];
    const mimes = tool === "Convert" ? ["image/jpeg", "image/jpeg", "image/jpeg"] : ["image/jpeg", "image/png", "image/webp"];
    for (const [index, name] of ["photo.jpg", "transparent.png", "banner.webp"].entries()) {
      await user.click(screen.getByRole("button", { name: `Preview ${name}` }));
      await user.click(screen.getByRole("button", { name: /Download image/ }));
      const [blob, filename] = download.mock.calls[index];
      expect(blob.type).toBe(mimes[index]);
      expect(filename).toBe(`${name.replace(/\.[^.]+$/, "")}-${tool.toLowerCase()}.${extensions[index]}`);
    }
    download.mockClear();
    await user.click(screen.getByRole("button", { name: /Download all/ }));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(3));
    expect(download.mock.calls.map(([blob]) => blob.type)).toEqual(mimes);
    expect(download.mock.calls.map(([, filename]) => filename.split(".").pop())).toEqual(extensions);
    await waitFor(() => expect(screen.getByRole("button", { name: /Download all/ })).toBeEnabled());
  });
});
