import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-50 flex justify-center pt-2">
      <div className="bg-white/30 px-4 py-4 rounded-full shadow-sm flex items-center h-fit">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    </div>
  );
}
