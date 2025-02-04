import { AuthToken, fetchApiwithAuth } from "@/api/admin";
import { ApiError, defaultError } from "@/lib/fetchApi";

export interface StorageFileInfo {
  name: string;
  modTime: number;
  isDir: boolean;
  isImage: boolean;
  internalUrl: string;
  uploadKey?: string;
  publicUrl?: string;
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
        Authorization: `Bearer ${AuthToken.value}`,
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

interface FilesListParams {
  directory: string | null | undefined;
  filter: string | null | undefined;
}

export async function getFilesList(params?: FilesListParams) {
  const { directory, filter } = params || {};

  const s = new URLSearchParams({
    directory: directory || ".",
    filter: filter || "",
  });

  const { data: list = [], error } = await fetchApiwithAuth<StorageFileInfo[]>(
    `/api/files/list?${s}`
  );
  return { list, error };
}

export async function deleteFile(fileName: string) {
  const { error } = await fetchApiwithAuth(`/api/files/${fileName}`, {
    method: "DELETE",
  });
  return { error };
}
