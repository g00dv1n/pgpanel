import { Toaster, toast as alert } from "sonner";

function GlobalAlert() {
  return <Toaster duration={5000} theme="light" position="top-right" richColors closeButton />;
}

export { GlobalAlert, alert };
