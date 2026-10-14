import { encodeCanvasBlob } from "@/lib/canvas-encoding";
import { validateFileSize } from "@/lib/file-validation";
import type { CompressLevel } from "@/types";
import type { ImageCompressOptions, ImageConvertOptions, ImageMimeType, ImageOperation, ImageOutputFormat, ImageProcessResult, ImageResizeOptions } from "../types";

export const MAX_IMAGE_BYTES = 20 * 1048576;
export const MAX_IMAGE_DIMENSION = 8192;
export const MAX_IMAGE_PIXELS = 40000000;
const formats: Record<ImageOutputFormat, ImageMimeType> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

export function validateImageFile(file: File): ImageMimeType {
  validateFileSize(file, MAX_IMAGE_BYTES);
  if (!Object.values(formats).includes(file.type as ImageMimeType)) throw new Error("Choose a PNG, JPEG, or WebP image.");
  return file.type as ImageMimeType;
}
function sourceFormat(file: File): ImageOutputFormat {
  const mime = validateImageFile(file);
  return mime === "image/jpeg" ? "jpeg" : mime === "image/webp" ? "webp" : "png";
}
export function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error("Width and height must be positive whole numbers.");
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) throw new Error("Image too large. Use up to 8192px per side and 40 megapixels.");
}
export function validateQuality(quality: number): void {
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) throw new Error("Quality must be between 0 and 1.");
}
export function compressionLevel(quality: number): CompressLevel {
  return quality >= 0.9 ? "low" : quality >= 0.6 ? "medium" : "high";
}
export function resizeDimensions(width: number, height: number, options: ImageResizeOptions): { width: number; height: number } {
  validateDimensions(width, height);
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (options.scalePercent !== undefined) {
    if (!Number.isFinite(options.scalePercent) || options.scalePercent <= 0) throw new Error("Scale must be a positive percentage.");
    targetWidth = Math.max(1, Math.round(width * options.scalePercent / 100));
    targetHeight = Math.max(1, Math.round(height * options.scalePercent / 100));
  } else {
    if (targetWidth === undefined && targetHeight === undefined) throw new Error("Enter a width or height.");
    for (const value of [targetWidth, targetHeight]) if (value !== undefined && (!Number.isInteger(value) || value <= 0)) throw new Error("Width and height must be positive whole numbers.");
    if (options.maintainAspectRatio || targetWidth === undefined || targetHeight === undefined) {
      if (targetWidth !== undefined) targetHeight = Math.max(1, Math.round(height * targetWidth / width));
      else if (targetHeight !== undefined) targetWidth = Math.max(1, Math.round(width * targetHeight / height));
    }
  }
  if (targetWidth === undefined || targetHeight === undefined) throw new Error("Enter valid dimensions.");
  validateDimensions(targetWidth, targetHeight);
  return { width: targetWidth, height: targetHeight };
}

export async function decodeImage(file: File): Promise<HTMLImageElement> {
  validateImageFile(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Cannot read this image. Choose another PNG, JPEG, or WebP file."));
      image.src = url;
    });
    validateDimensions(image.naturalWidth, image.naturalHeight);
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export function encodeCanvas(canvas: HTMLCanvasElement, outputFormat: ImageOutputFormat, quality?: number): Promise<Blob> {
  const mime = formats[outputFormat];
  if (!mime) throw new Error("Choose PNG, JPG, or WebP as the output format.");
  if (quality !== undefined) validateQuality(quality);
  return encodeCanvasBlob(canvas, mime, quality);
}

async function processImage(file: File, operation: ImageOperation, outputFormat: ImageOutputFormat, quality?: number, resizeOptions?: ImageResizeOptions): Promise<ImageProcessResult> {
  if (!formats[outputFormat]) throw new Error("Choose PNG, JPG, or WebP as the output format.");
  if (quality !== undefined) validateQuality(quality);
  const image = await decodeImage(file);
  const { width, height } = resizeOptions ? resizeDimensions(image.naturalWidth, image.naturalHeight, resizeOptions) : { width: image.naturalWidth, height: image.naturalHeight };
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser does not support Canvas. Try a current browser.");
    if (outputFormat === "jpeg") { context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height); }
    context.drawImage(image, 0, 0, width, height);
    const outputBlob = await encodeCanvas(canvas, outputFormat, quality);
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const sourceExtension = file.name.split(".").pop()?.toLowerCase();
    const extension = outputFormat === "jpeg"
      ? operation !== "convert" && sourceExtension === "jpeg" ? "jpeg" : "jpg"
      : outputFormat;
    return { operation, outputFileName: `${base}-${operation}.${extension}`, outputBlob, outputFormat, originalSize: file.size, outputSize: outputBlob.size, width, height, createdAt: new Date().toISOString() };
  } finally { canvas.width = 0; canvas.height = 0; }
}
export async function resizeImage(file: File, options: ImageResizeOptions): Promise<ImageProcessResult> {
  const format = sourceFormat(file);
  return processImage(file, "resize", format, format === "png" ? undefined : 0.92, options);
}
export async function convertImage(file: File, options: ImageConvertOptions): Promise<ImageProcessResult> {
  if (options.quality !== undefined) validateQuality(options.quality);
  return processImage(file, "convert", options.outputFormat, options.outputFormat === "png" ? undefined : options.quality ?? 0.92);
}
export async function compressImage(file: File, options: ImageCompressOptions): Promise<ImageProcessResult> {
  if (!["low", "medium", "high"].includes(options.level)) throw new Error("Choose a valid compression level.");
  validateQuality(options.quality);
  const format = sourceFormat(file);
  return processImage(file, "compress", format, format === "png" ? undefined : options.quality);
}
export async function createSampleImage(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 960; canvas.height = 600;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser does not support Canvas.");
    const gradient = context.createLinearGradient(0, 0, 960, 600);
    gradient.addColorStop(0, "#3B6EF6"); gradient.addColorStop(1, "#22D3EE");
    context.fillStyle = gradient; context.fillRect(0, 0, 960, 600);
    context.fillStyle = "#ffffff"; context.beginPath(); context.arc(700, 175, 85, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#163d82"; context.beginPath(); context.moveTo(0, 600); context.lineTo(340, 210); context.lineTo(620, 600); context.fill();
    context.fillStyle = "#ffffff"; context.font = "bold 44px sans-serif"; context.fillText("A little room to create.", 60, 530);
    return new File([await encodeCanvas(canvas, "png")], "webutil-sample.png", { type: "image/png" });
  } finally { canvas.width = 0; canvas.height = 0; }
}
