import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PDFDocument } from "pdf-lib";
import { PdfTools } from "@/features/pdf-tools";
import { usePdfProcessor } from "@/features/pdf-tools/hooks/usePdfProcessor";
import { blobBytes, installPdfFileReader, pdfFile } from "./pdf-test-utils";

describe("PDF tools integration", () => {
  beforeEach(() => installPdfFileReader());
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("uploads, reorders, merges, downloads with URL cleanup, and resets", async () => {
    const createUrl = vi.fn<(blob: Blob) => string>(() => "blob:pdf-output"); const revokeUrl = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup(); render(<PdfTools />);
    await user.upload(screen.getByLabelText("Choose PDFs"), [await pdfFile("first.pdf"), await pdfFile("second.pdf")]);
    const merge = screen.getByRole("button", { name: "Merge PDFs" });
    await waitFor(() => expect(merge).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Move second.pdf up" }));
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("second.pdf");
    await user.click(merge); expect(await screen.findByRole("status", { name: "PDF result" })).toHaveTextContent("merged.pdf");
    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(click).toHaveBeenCalledOnce(); expect(createUrl.mock.calls[0][0]).toBeInstanceOf(Blob);
    await waitFor(() => expect(revokeUrl).toHaveBeenCalledWith("blob:pdf-output"), { timeout: 2000 });
    await user.click(screen.getByRole("button", { name: "Move first.pdf up" }));
    expect(screen.queryByRole("status", { name: "PDF result" })).not.toBeInTheDocument();
    await user.click(merge); await screen.findByRole("status", { name: "PDF result" });
    await user.click(screen.getByRole("button", { name: "Again" })); expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(merge).toBeDisabled();
  });
  it("exposes lifecycle transitions and locks actions while busy", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    expect(result.current.status).toBe("idle");
    const files = [await pdfFile("one.pdf"), await pdfFile("two.pdf")];
    let upload!: Promise<void>;
    act(() => { upload = result.current.addFiles(files); }); expect(result.current.status).toBe("validating");
    await act(async () => { await upload; }); expect(result.current.status).toBe("ready");
    let processing!: Promise<void>;
    act(() => { processing = result.current.process(); }); expect(result.current.status).toBe("processing");
    act(() => { result.current.removeFile(result.current.files[0].id); result.current.changeOperation("split"); });
    expect(result.current.files).toHaveLength(2); expect(result.current.operation).toBe("merge");
    await act(async () => { await processing; }); expect(result.current.status).toBe("done");
    expect(result.current.result?.operation).toBe("merge");
  });
  it("blocks merge when any file is invalid and recovers after removal", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    await act(async () => { await result.current.addFiles([await pdfFile(), new File(["x"], "bad.txt", { type: "text/plain" })]); });
    expect(result.current.status).toBe("error");
    await act(async () => { await result.current.process(); }); expect(result.current.result).toBeNull();
    expect(result.current.error).toContain("Remove invalid");
    act(() => result.current.removeFile(result.current.files[1].id)); expect(result.current.status).toBe("ready");
  });
  it("offers Merge, Split, and Compress and resets through keyboard tab navigation", async () => {
    const user = userEvent.setup(); render(<PdfTools />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Compress" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Watermark/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ add sample" }));
    await screen.findByText("webutil-sample.pdf");
    await waitFor(() => expect(screen.getByText(/5 pages · ready/)).toBeInTheDocument());
    screen.getByRole("tab", { name: "Merge" }).focus(); await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Split" })).toHaveFocus();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByLabelText("Page range")).toHaveValue("");
    expect(screen.getByLabelText("Choose PDFs")).not.toHaveAttribute("multiple");
    await user.keyboard("{Home}"); expect(screen.getByRole("tab", { name: "Merge" })).toHaveFocus();
  });
  it("splits in requested order, shows range errors, and invalidates modified output", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    act(() => result.current.changeOperation("split"));
    await act(async () => { await result.current.addFiles([await pdfFile("report.pdf")]); });
    act(() => result.current.updateRanges("5,1-3,3"));
    await act(async () => { await result.current.process(); });
    expect(result.current.status).toBe("done");
    const output = await PDFDocument.load(await blobBytes(result.current.result!.outputBlob));
    expect(output.getPages().map(page => page.getWidth())).toEqual([500, 100, 200, 300]);
    act(() => result.current.updateRanges("9")); expect(result.current.result).toBeNull();
    await act(async () => { await result.current.process(); });
    expect(result.current.status).toBe("error"); expect(result.current.error).toContain("1 to 5");
    act(() => result.current.again()); expect(result.current.status).toBe("idle"); expect(result.current.ranges).toBe("");
  });
  it("runs the split form with sample input and drops a replacement PDF", async () => {
    const user = userEvent.setup(); render(<PdfTools />);
    await user.click(screen.getByRole("tab", { name: "Split" }));
    await user.click(screen.getByRole("button", { name: "+ add sample" }));
    await waitFor(() => expect(screen.getByText(/5 pages · ready/)).toBeInTheDocument());
    await user.type(screen.getByLabelText("Page range"), "7");
    await user.click(screen.getByRole("button", { name: "Split PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("1 to 5");
    await user.clear(screen.getByLabelText("Page range")); await user.type(screen.getByLabelText("Page range"), "2-3");
    await user.click(screen.getByRole("button", { name: "Split PDF" }));
    expect(await screen.findByRole("status", { name: "PDF result" })).toHaveTextContent("webutil-sample-split.pdf");
    fireEvent.drop(screen.getByRole("button", { name: /Drop one PDF here/ }), { dataTransfer: { files: [await pdfFile("replacement.pdf")] } });
    await waitFor(() => expect(screen.getByText("replacement.pdf")).toBeInTheDocument());
    expect(screen.queryByRole("status", { name: "PDF result" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Remove replacement.pdf" }));
    expect(screen.getByRole("button", { name: "Split PDF" })).toBeDisabled();
  });
  it("rejects multi-file drops in split mode", async () => {
    const { result } = renderHook(() => usePdfProcessor());
    act(() => result.current.changeOperation("split"));
    await act(async () => { await result.current.addFiles([await pdfFile(), await pdfFile()]); });
    expect(result.current.files).toHaveLength(0); expect(result.current.error).toContain("one PDF");
  });
  it("discards asynchronous validation finishing after unmount", async () => {
    const file = await pdfFile();
    let finish!: (bytes: ArrayBuffer) => void;
    const bytes = await file.arrayBuffer();
    Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>(resolve => { finish = resolve; }) });
    const { result, unmount } = renderHook(() => usePdfProcessor());
    let upload!: Promise<void>; act(() => { upload = result.current.addFiles([file]); });
    expect(result.current.status).toBe("validating"); unmount();
    await act(async () => { finish(bytes); await upload; });
    expect(result.current.files[0].pageCount).toBeUndefined();
  });
  it("discards processing finishing after unmount", async () => {
    const { result, unmount } = renderHook(() => usePdfProcessor());
    await act(async () => { await result.current.addFiles([await pdfFile(), await pdfFile()]); });
    let processing!: Promise<void>; act(() => { processing = result.current.process(); });
    unmount(); await act(async () => { await processing; });
    expect(result.current.result).toBeNull();
  });

});
