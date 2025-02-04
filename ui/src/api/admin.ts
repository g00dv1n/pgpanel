import { ApiUrl, fetchApi } from "@/lib/fetchApi";

const AuthTokenKey = "pgPanel_authToken";

export const AuthToken = {
  value: localStorage.getItem(AuthTokenKey) || "",
};

export function updateAuthToken(token: string) {
  AuthToken.value = token;
  localStorage.setItem(AuthTokenKey, token);
}

export const fetchApiwithAuth = createFetchWithAuth();

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
    updateAuthToken(data.token);
  }

  return error;
}
