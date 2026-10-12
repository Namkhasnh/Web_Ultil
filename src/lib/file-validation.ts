export function validateFileSize(file: File, maxSizeBytes: number): void {
  if (file.size === 0) throw new Error("This file is empty. Choose another file.");
  if (file.size > maxSizeBytes) throw new Error(`File too large. Maximum size is ${Math.round(maxSizeBytes / 1048576)} MiB.`);
}
