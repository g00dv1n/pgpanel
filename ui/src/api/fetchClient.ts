export type ApiErr = { code: number; message: string };
export type ApiUrl = string | URL;

export async function fetchAsJson<T = any>(
  input: string | URL | globalThis.Request,
  init?: RequestInit
): Promise<{ data?: T; error?: ApiErr }> {
  const defaultInit: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  };

  try {
    const res = await fetch(input, defaultInit);
    const jsonRes = await res.json();

    let data: T | undefined = undefined;
    let error: ApiErr | undefined = undefined;

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

export function createAuthFetchClient(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  return {
    fetchAsJson<T>(url: ApiUrl, init?: RequestInit) {
      const initWithAuth: RequestInit = {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      };

      return fetchAsJson<T>(url, initWithAuth);
    },
    get<T>(url: ApiUrl) {
      return fetchAsJson<T>(url, {
        method: "GET",
        headers,
      });
    },
    post<T>(url: ApiUrl, body: any) {
      return fetchAsJson<T>(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });
    },
    put<T>(url: ApiUrl, body: any) {
      return fetchAsJson<T>(url, {
        method: "PUT",
        body: JSON.stringify(body),
        headers,
      });
    },

    delete<T>(url: ApiUrl) {
      return fetchAsJson<T>(url, {
        method: "DELETE",
        headers,
      });
    },
  };
}
