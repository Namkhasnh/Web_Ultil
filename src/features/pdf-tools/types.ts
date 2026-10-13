import type { CompressLevel, FileProcessingStatus, ISODateString } from "@/types";

export type PDFOperation = "merge" | "split" | "compress" | "remove-watermark";
export type SupportedPDFOperation = Extract<PDFOperation, "merge" | "split" | "compress">;
export type PDFFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: "application/pdf";
  pageCount?: number;
  status: FileProcessingStatus;
  error?: string;
};
export type PDFCompressOptions = { level: CompressLevel };
export type PDFSplitOptions = { ranges: string };
export type PDFProcessResult = {
  operation: PDFOperation;
  outputFileName: string;
  outputBlob: Blob;
  originalSize: number;
  outputSize: number;
  createdAt: ISODateString;
};
