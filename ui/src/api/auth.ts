import { ApiUrl, fetchApi } from "@/lib/fetchApi";

const AuthTokenKey = "pgPanel_authToken";

export const fetchApiwithAuth = createFetchWithAuth(
  localStorage.getItem(AuthTokenKey)
);

export function createFetchWithAuth(token: string | undefined | null) {
  return async function <T>(url: ApiUrl, init?: RequestInit) {
    const res = await fetchApi<T>(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    });

    if (res.error && res.error.code === 403) {
      window.location.replace(`/login?authError=${res.error.message}`);
    }

    return res;
  };
}

export interface LoginCreds {
  username: string;
  password: string;
}

export interface SuccessLogin {
  token: string;
}

export async function adminLogin(creds: LoginCreds) {
  const { data, error } = await fetchApi<SuccessLogin>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(creds),
  });

  if (!error && data) {
    localStorage.setItem(AuthTokenKey, data.token);
    window.location.href = "/";
  }

  return error;
}
