/** Encode a browser canvas without coupling to a feature's file/result types. */
export function encodeCanvasBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) throw new Error("Choose PNG, JPG, or WebP as the output format.");
  if (quality !== undefined && (!Number.isFinite(quality) || quality < 0 || quality > 1)) throw new Error("Quality must be between 0 and 1.");
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => {
        if (!blob) reject(new Error("Could not create the image. Try smaller dimensions."));
        else if (blob.type !== mime) reject(new Error(`Your browser cannot export ${mime.slice(6).toUpperCase()}. Choose another format.`));
        else resolve(blob);
      }, mime, quality);
    } catch { reject(new Error("Image export failed. Try smaller dimensions or another format.")); }
  });
}
