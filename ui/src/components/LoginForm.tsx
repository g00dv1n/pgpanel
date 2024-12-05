import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  error?: string;
  onSubmit: (data: { username: string; password: string }) => void;
}

export function LoginForm({ error, onSubmit }: LoginFormProps) {
  const submit = (formData: FormData) => {
    onSubmit({
      username: stringFormField(formData, "username"),
      password: stringFormField(formData, "password"),
    });
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription>
          Enter your username and password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" action={submit}>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input name="username" type="text" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input name="password" type="password" required />
          </div>
          {error && <span className="text-red-500">{error}</span>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function stringFormField(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!value) return "";

  if (typeof value !== "string") return "";

  return value;
}
