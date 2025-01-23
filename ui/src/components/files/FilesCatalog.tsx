import { StorageFileInfo } from "@/api/files";

interface FilesCatalogProps {
  list: StorageFileInfo[];
  selected?: StorageFileInfo[];
  onSelect?: (file: StorageFileInfo, newSelected: boolean) => void;
}

export function FilesCatalog({
  list,
  selected = [],
  onSelect,
}: FilesCatalogProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      {list.map((info) => {
        const isSelected = selected.some((sf) => sf.name === info.name);

        return (
          <div
            key={info.name}
            className={`
              flex flex-col gap-1 items-center relative w-60 p-1 border-2 rounded
              ${isSelected ? "border-blue-500" : ""}
              cursor-pointer hover:opacity-80 transition-all
            `}
            onClick={() => onSelect && onSelect(info, !isSelected)}
          >
            <img className="size-60 object-cover" src={info.internalUrl} />
            <div className="w-full text-center break-words">{info.name}</div>
          </div>
        );
      })}
    </div>
  );
}
