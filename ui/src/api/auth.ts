import { fetchApi } from "@/api/fetchClient";

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
    localStorage.setItem("authToken", data.token);
    window.location.href = "/";
  }

  return error;
}
