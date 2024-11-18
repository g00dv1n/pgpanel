export type ApiError = { code: number; message: string };
export type ApiUrl = string | URL;

export async function fetchApi<T = any>(
  url: ApiUrl,
  init?: RequestInit
): Promise<{ data?: T; error?: ApiError }> {
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

    let data: T | undefined = undefined;
    let error: ApiError | undefined = undefined;

    if (res.ok) {
      data = jsonRes;
    } else {
      error = jsonRes;
    }
    return { data, error };
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
