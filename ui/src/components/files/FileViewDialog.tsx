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
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
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

  file.uploadKey && items.push({ label: "Upload Key", value: file.uploadKey });
  file.publicUrl && items.push({ label: "Public Url", value: file.publicUrl });

  return (
    <div className="flex flex-col gap-3 items-center">
      {file.isImage && <img src={file.internalUrl} />}

      {items.map((item) => {
        return (
          <div className="w-full flex gap-2 items-center">
            <div className="w-full flex gap-3 items-center">
              <Label className="w-16">{item.label}</Label>
              <Input defaultValue={item.value} readOnly />
            </div>
            <CopyButton value={item.value} />
          </div>
        );
      })}
    </div>
  );
}
