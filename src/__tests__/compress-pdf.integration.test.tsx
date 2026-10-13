import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfTools } from "@/features/pdf-tools";
import { usePdfProcessor } from "@/features/pdf-tools/hooks/usePdfProcessor";
import { compressionPdfFile, installPdfFileReader, pdfFile } from "./pdf-test-utils";

describe("Compress PDF integration", () => {
  beforeEach(() => installPdfFileReader());
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("uploads, selects compression, downloads with cleanup, replaces/removes input and resets", async () => {
    const createUrl = vi.fn<(blob: Blob) => string>(() => "blob:compressed-pdf");
    const revokeUrl = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup(); render(<PdfTools />);
    await user.click(screen.getByRole("tab", { name: "Compress" }));
    expect(screen.getByRole("radio", { name: /^Balanced/ })).toBeChecked();
    expect(screen.getByLabelText("Choose PDFs")).not.toHaveAttribute("multiple");
    const button = screen.getByRole("button", { name: "Compress PDF" });
    expect(button).toBeDisabled();
    await user.upload(screen.getByLabelText("Choose PDFs"), await compressionPdfFile());
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(screen.getByRole("radio", { name: /Maximum/ }));
    await user.click(button);
    const result = await screen.findByRole("status", { name: "PDF result" });
    expect(result).toHaveTextContent("report-compressed.pdf");
    expect(result).toHaveTextContent(/% saved/);
    expect(result).toHaveTextContent("Text and image quality preserved.");
    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(download).toHaveBeenCalledOnce();
    expect(createUrl.mock.calls[0][0]).toBeInstanceOf(Blob);
    await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith("blob:compressed-pdf"), { timeout: 2000 });
    await user.click(screen.getByRole("radio", { name: /Light/ }));
    expect(screen.queryByRole("status", { name: "PDF result" })).not.toBeInTheDocument();
    await user.click(button); await screen.findByRole("status", { name: "PDF result" });
    fireEvent.drop(screen.getByRole("button", { name: /Drop one PDF here/ }), { dataTransfer: { files: [await compressionPdfFile("replacement.pdf")] } });
    await waitFor(() => expect(screen.getByText("replacement.pdf")).toBeInTheDocument());
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("status", { name: "PDF result" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove replacement.pdf" }));
    expect(button).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "+ add sample" }));
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button); await screen.findByRole("status", { name: "PDF result" });
    await user.click(screen.getByRole("button", { name: "Again" }));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(button).toBeDisabled();
  });

  it("reports unchanged size when the original PDF is returned", async () => {
    const user = userEvent.setup(); render(<PdfTools />);
    await user.click(screen.getByRole("tab", { name: "Compress" }));
    await user.click(screen.getByRole("radio", { name: /Light/ }));
    await user.upload(screen.getByLabelText("Choose PDFs"), await pdfFile());
    const button = screen.getByRole("button", { name: "Compress PDF" });
    await waitFor(() => expect(button).toBeEnabled()); await user.click(button);
    const result = await screen.findByRole("status", { name: "PDF result" });
    expect(result).toHaveTextContent("0.0% saved");
    expect(result).toHaveTextContent("This PDF is already optimized; file size did not decrease.");
  });

  it("exposes lifecycle, locks actions, invalidates options and recovers from invalid input", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    expect(result.current.status).toBe("idle");
    act(() => result.current.changeOperation("compress"));
    const file = await compressionPdfFile();
    let upload!: Promise<void>;
    act(() => { upload = result.current.addFiles([file]); });
    expect(result.current.status).toBe("validating");
    await act(async () => { await upload; }); expect(result.current.status).toBe("ready");
    let processing!: Promise<void>;
    act(() => { processing = result.current.process(); }); expect(result.current.status).toBe("processing");
    act(() => { result.current.updateCompressLevel("high"); result.current.removeFile(result.current.files[0].id); result.current.changeOperation("merge"); });
    expect(result.current.compressLevel).toBe("medium");
    expect(result.current.operation).toBe("compress"); expect(result.current.files).toHaveLength(1);
    await act(async () => { await processing; }); expect(result.current.status).toBe("done");
    expect(result.current.result).toMatchObject({ operation: "compress", outputFileName: "report-compressed.pdf", originalSize: file.size });
    act(() => result.current.updateCompressLevel("low")); expect(result.current.result).toBeNull(); expect(result.current.status).toBe("ready");
    await act(async () => { await result.current.addFiles([new File(["bad"], "bad.txt", { type: "text/plain" })]); });
    expect(result.current.status).toBe("error");
    await act(async () => { await result.current.process(); });
    expect(result.current.result).toBeNull(); expect(result.current.error).toContain("Remove invalid");
    await act(async () => { await result.current.addFiles([file]); }); expect(result.current.status).toBe("ready");
    act(() => result.current.again()); expect(result.current.status).toBe("idle");
    await act(async () => { await result.current.process(); }); expect(result.current.error).toContain("one PDF");
  });

  it("rejects multiple-file drops without replacing the existing input", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    act(() => result.current.changeOperation("compress"));
    const file = await compressionPdfFile();
    await act(async () => { await result.current.addFiles([file]); });
    await act(async () => { await result.current.addFiles([file, file]); });
    expect(result.current.files).toHaveLength(1); expect(result.current.error).toContain("one PDF");
  });

  it.each(["validating", "processing"] as const)("discards %s results finishing after unmount", async phase => {
    const file = await compressionPdfFile();
    const bytes = await file.arrayBuffer();
    const { result, unmount } = renderHook(() => usePdfProcessor());
    act(() => result.current.changeOperation("compress"));
    let pending!: Promise<void>;
    let finish!: (bytes: ArrayBuffer) => void;
    if (phase === "validating") {
      Object.defineProperty(file, "arrayBuffer", { configurable: true, value: () => new Promise<ArrayBuffer>(resolve => { finish = resolve; }) });
      act(() => { pending = result.current.addFiles([file]); });
    } else {
      await act(async () => { await result.current.addFiles([file]); });
      act(() => { pending = result.current.process(); });
    }
    expect(result.current.status).toBe(phase); unmount();
    await act(async () => { if (phase === "validating") finish(bytes); await pending; });
    expect(result.current.result).toBeNull();
    if (phase === "validating") expect(result.current.files[0].pageCount).toBeUndefined();
  });
});
