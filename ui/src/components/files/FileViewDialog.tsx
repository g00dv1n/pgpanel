import { StorageFileInfo } from "@/api/files";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileViewDialogProps {
  file?: StorageFileInfo;
  onClose?: () => void;
}

export function FileViewDialog({ file, onClose }: FileViewDialogProps) {
  const isOpen = Boolean(file);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose && onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File View</DialogTitle>
        </DialogHeader>
        {file && <FileView file={file} />}
      </DialogContent>
    </Dialog>
  );
}

interface FileViewProps {
  file: StorageFileInfo;
}

export function FileView({ file }: FileViewProps) {
  const items = [{ label: "Name", value: file.name }];

  return (
    <div className="flex flex-col items-center">
      {file.isImage && <img src={file.internalUrl} />}

      {items.map((item) => {
        return (
          <div className="w-full flex gap-2 items-center my-3">
            <div className="w-full flex gap-3 items-center">
              <Label>{item.label}</Label>
              <Input defaultValue={item.value} readOnly />
            </div>
            <CopyButton value={item.value} />
          </div>
        );
      })}
    </div>
  );
}
