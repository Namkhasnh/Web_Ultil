import type { CompressLevel, FileProcessingStatus, ISODateString } from "@/types";

export type ImageOperation = "resize" | "convert" | "compress";
export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";
export type ImageOutputFormat = "png" | "jpeg" | "webp";
export type ImageFile = {
  id: string; file: File; name: string; size: number; type: ImageMimeType;
  width?: number; height?: number; previewUrl?: string; status: FileProcessingStatus; error?: string;
};
export type ImageResizeOptions = { width?: number; height?: number; scalePercent?: number; maintainAspectRatio: boolean };
export type ImageConvertOptions = { outputFormat: ImageOutputFormat; quality?: number };
export type ImageCompressOptions = { quality: number; level: CompressLevel };
export type ImageProcessResult = {
  operation: ImageOperation; outputFileName: string; outputBlob: Blob; outputFormat: ImageOutputFormat;
  originalSize: number; outputSize: number; width?: number; height?: number; createdAt: ISODateString;
};
export type ImageSettings = {
  operation: ImageOperation; resizeMode: "pixels" | "percentage"; width: string; height: string;
  scalePercent: string; maintainAspectRatio: boolean; lastDimension: "width" | "height";
  outputFormat: ImageOutputFormat; quality: number;
};
export type ImageOutput = { id: string; result: ImageProcessResult; previewUrl: string };
