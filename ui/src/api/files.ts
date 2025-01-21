import { getAuthToken } from "@/api/admin";
import { ApiError, defaultError } from "@/lib/fetchApi";

export interface StorageFileInfo {
  name: string;
  isDir: boolean;
  isImage: boolean;
}

export async function uploadFile(file: File) {
  const body = new FormData();
  body.append("file", file);

  // Don't use fetchApi or fetchApiwithAuth helpers to prevent default content type
  // we need to leave it empty to allow browser do the work
  try {
    const res = await fetch("/api/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body,
    });

    const jsonRes = await res.json();

    if (res.ok) {
      return { fileInfo: jsonRes as StorageFileInfo };
    } else {
      return { error: jsonRes as ApiError };
    }
  } catch (err) {
    return { error: defaultError(err) };
  }
}
