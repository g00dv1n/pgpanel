import { AuthToken } from "@/lib/auth";
import { fetchApi } from "@/lib/fetchApi";

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
    AuthToken.value = data.token;
  }

  return error;
}
