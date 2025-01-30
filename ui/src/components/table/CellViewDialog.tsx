interface CellViewDialogProps {
  value?: string;
  onClose?: () => void;
}

import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CellViewDialog({ value = "", onClose }: CellViewDialogProps) {
  const isOpen = value.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose && onClose();
        }
      }}
    >
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cell View</DialogTitle>
        </DialogHeader>
        <AutosizeTextarea
          minHeight={28}
          maxHeight={800}
          value={value}
          readOnly={true}
        />
        <CopyButton value={value} label="Copy to clipboard" />
      </DialogContent>
    </Dialog>
  );
}
