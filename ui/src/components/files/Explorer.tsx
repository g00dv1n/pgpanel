import { StorageFileInfo } from "@/api/files";
import { Checkbox } from "@/components/ui/checkbox";
import { File } from "lucide-react";

interface ExplorerProps {
  list: StorageFileInfo[];
  selected?: StorageFileInfo[];
  onSelect?: (file: StorageFileInfo, newSelected: boolean) => void;
}

export function Explorer({ list, selected = [], onSelect }: ExplorerProps) {
  const files = list.filter((fi) => !fi.isDir);

  return (
    <div className="w-full flex gap-3 flex-wrap">
      {files.map((info) => {
        const isSelected = selected.some((sf) => sf.name === info.name);

        return (
          <div
            key={info.name}
            className={`
              flex flex-col gap-1 items-center w-48 p-1 border-2 rounded relative
              ${isSelected ? "border-blue-500" : ""}
              cursor-pointer hover:opacity-90 transition-all
            `}
          >
            <Checkbox
              checked={isSelected}
              className="absolute left-2 top-1"
              onCheckedChange={(c) => onSelect && onSelect(info, c === true)}
            />

            {info.isImage ? (
              <img className="size-32 object-cover" src={info.internalUrl} />
            ) : (
              <File className="size-32" />
            )}

            <div className="w-full text-center break-words">{info.name}</div>
          </div>
        );
      })}
    </div>
  );
}
