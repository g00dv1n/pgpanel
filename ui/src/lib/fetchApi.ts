export type ApiError = { code: number; message: string };
export type ApiUrl = string | URL;

export type ApiResult<T> =
  | { data: T; error: undefined }
  | { data: undefined; error: ApiError };

export async function fetchApi<T>(
  url: ApiUrl,
  init?: RequestInit
): Promise<ApiResult<T>> {
  const defaultInit: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  };

  try {
    const res = await fetch(url, defaultInit);
    const jsonRes = await res.json();

    if (res.ok) {
      return { data: jsonRes, error: undefined };
    } else {
      return { data: undefined, error: jsonRes };
    }
  } catch (err) {
    return {
      data: undefined,
      error: {
        code: 500,
        message: `Fetch error: ${err}`,
      },
    };
  }
}
