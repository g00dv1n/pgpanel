import { ApiUrl, fetchApi } from "@/lib/fetchApi";

const AuthTokenKey = "pgPanel_authToken";

export const AuthToken = {
  get value() {
    return localStorage.getItem(AuthTokenKey) || "";
  },

  set value(token: string) {
    localStorage.setItem(AuthTokenKey, token);
  },
};

export function createFetchWithAuth() {
  return async function <T>(url: ApiUrl, init?: RequestInit) {
    const res = await fetchApi<T>(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${AuthToken.value}`,
        ...init?.headers,
      },
    });

    if (res.error && res.error.code === 403) {
      window.location.replace(`/login?authError=${res.error.message}`);
    }

    return res;
  };
}

export const fetchApiwithAuth = createFetchWithAuth();
