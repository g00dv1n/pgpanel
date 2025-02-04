import { adminLogin } from "@/api/admin";
import { LoginForm } from "@/components/LoginForm";
import { alert, GlobalAlert } from "@/components/ui/global-alert";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export function LoginPage() {
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [searchParams] = useSearchParams();

  const authError = searchParams.get("authError");
  const expiredError = authError === "token is expired";

  useEffect(() => {
    if (expiredError) {
      alert.error(" Your session has expired. Please log in again.");
    }
  });

  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginForm
        error={loginError}
        onSubmit={async (data) => {
          const newLoginError = await adminLogin(data);
          setLoginError(newLoginError?.message);

          if (!newLoginError) {
            navigate("/");
          }
        }}
      />

      <GlobalAlert />
    </div>
  );
}
