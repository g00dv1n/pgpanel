export type ApiError = { code: number; message: string };
export type ApiUrl = string | URL;

export type ApiResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: ApiError };

export function defaultError(err: unknown) {
  return { code: 500, message: `Fetch error: ${err}` };
}

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
      return { data: jsonRes };
    } else {
      return { error: jsonRes };
    }
  } catch (err) {
    return { error: defaultError(err) };
  }
}
