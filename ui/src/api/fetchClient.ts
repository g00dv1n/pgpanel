export type ApiErr = { code: number; message: string };
export type ApiUrl = string | URL;

export async function fetchApi<T = any>(
  url: ApiUrl,
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
    const res = await fetch(url, defaultInit);
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

  async function authFetch<T>(url: ApiUrl, init?: RequestInit) {
    const res = await fetchApi<T>(url, init);

    if (res.error && res.error.code === 403) {
      window.location.href = "/login";
    }

    return res;
  }

  return {
    fetch<T>(url: ApiUrl, init?: RequestInit) {
      const initWithAuth: RequestInit = {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      };

      return authFetch<T>(url, initWithAuth);
    },
    get<T>(url: ApiUrl) {
      return authFetch<T>(url, {
        method: "GET",
        headers,
      });
    },
    post<T>(url: ApiUrl, body: any) {
      return authFetch<T>(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });
    },
    put<T>(url: ApiUrl, body: any) {
      return authFetch<T>(url, {
        method: "PUT",
        body: JSON.stringify(body),
        headers,
      });
    },

    delete<T>(url: ApiUrl) {
      return authFetch<T>(url, {
        method: "DELETE",
        headers,
      });
    },
  };
}
