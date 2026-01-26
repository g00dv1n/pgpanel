import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export function LoadingButton({ loading = false, ...props }: LoadingButtonProps) {
  const disabled = loading ? true : props.disabled;

  const hideChildren = loading && props.size === "icon";

  return (
    <Button {...props} disabled={disabled}>
      {loading && <Loader2 className="animate-spin" />}
      {!hideChildren && props.children}
    </Button>
  );
}
