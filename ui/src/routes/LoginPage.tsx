import { adminLogin } from "@/api/auth";
import { LoginForm } from "@/components/LoginForm";
import { useState } from "react";

export default function LoginPage() {
  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginForm
        error={loginError}
        onSubmit={async (data) => {
          const newLoginError = await adminLogin(data);

          setLoginError(newLoginError?.message);
        }}
      />
    </div>
  );
}
