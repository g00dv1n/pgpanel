import { StorageFileInfo } from "@/api/files";
import { Checkbox } from "@/components/ui/checkbox";

interface ExplorerProps {
  list: StorageFileInfo[];
  selected?: StorageFileInfo[];
  onSelect?: (file: StorageFileInfo, newSelected: boolean) => void;
}

export function Explorer({ list, selected = [], onSelect }: ExplorerProps) {
  return (
    <div className="w-full flex gap-4 flex-wrap">
      {list.map((info) => {
        const isSelected = selected.some((sf) => sf.name === info.name);

        return (
          <div
            key={info.name}
            className={`
              flex flex-col gap-1 items-center w-60 p-1 border-2 rounded relative
              ${isSelected ? "border-blue-500" : ""}
              cursor-pointer hover:opacity-90 transition-all
            `}
          >
            <Checkbox
              checked={isSelected}
              className="absolute left-2 top-2"
              onCheckedChange={(c) => onSelect && onSelect(info, c === true)}
            />
            <img className="size-60 object-cover" src={info.internalUrl} />
            <div className="w-full text-center break-words">{info.name}</div>
          </div>
        );
      })}
    </div>
  );
}
