import { adminLogin } from "@/api/auth";
import { LoginForm } from "@/components/LoginForm";
import { useState } from "react";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [searchParams] = useSearchParams();

  const authError = searchParams.get("authError");
  const expiredError = authError === "token is expired";

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      {expiredError && (
        <Alert variant="destructive" className="absolute right-2 top-2 w-fit">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Your session has expired. Please log in again.
          </AlertDescription>
        </Alert>
      )}

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
