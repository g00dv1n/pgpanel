import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadBlob(fileBlob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(fileBlob);

  // Create an anchor element and set its properties
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;

  // Programmatically click the anchor to trigger the download
  anchor.click();

  // Clean up
  URL.revokeObjectURL(blobUrl);
}
