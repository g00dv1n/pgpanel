import { AuthToken } from "@/lib/auth";
import { ApiError, defaultError } from "@/lib/fetchApi";
import { PgTable } from "@/lib/pgTypes";

interface ExportDatabaseOptions {
  tables?: PgTable[];
  dataOnly?: boolean;
  clean?: boolean;
}

export async function exportDatabase(options: ExportDatabaseOptions) {
  try {
    const res = await fetch("/api/backup/export-db", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AuthToken.value}`,
      },
      body: JSON.stringify(options),
    });

    if (res.ok) {
      const fileBlob = await res.blob();
      return { fileBlob };
    } else {
      const jsonRes = await res.json();
      return { error: jsonRes as ApiError };
    }
  } catch (err) {
    return { error: defaultError(err) };
  }
}

export async function importDatabase(file: File) {
  const body = new FormData();
  body.append("file", file);

  try {
    const res = await fetch("/api/backup/import-db", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AuthToken.value}`,
      },
      body,
    });

    if (res.ok) {
      return {};
    } else {
      const error: ApiError = await res.json();
      return { error };
    }
  } catch (err) {
    return { error: defaultError(err) };
  }
}

export async function exportStorage() {
  try {
    const res = await fetch("/api/backup/export-storage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AuthToken.value}`,
      },
    });

    if (res.ok) {
      const fileBlob = await res.blob();
      return { fileBlob };
    } else {
      const jsonRes = await res.json();
      return { error: jsonRes as ApiError };
    }
  } catch (err) {
    return { error: defaultError(err) };
  }
}
