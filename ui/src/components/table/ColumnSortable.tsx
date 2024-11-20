import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface ColumnSortableProps {
  name: string;
  sortValue?: string[];
  onChange: (newVal: string) => void;
}

export function ColumnSortable({
  name,
  sortValue = [],
  onChange,
}: ColumnSortableProps) {
  const askValue = name;
  const descValue = `-${name}`;

  let currentSortValue: undefined | string = undefined;

  for (const v of sortValue) {
    if (v == askValue) {
      currentSortValue = askValue;
      break;
    }

    if (v === descValue) {
      currentSortValue = descValue;
      break;
    }
  }

  return (
    <Button
      variant="ghost"
      className="p-0"
      onClick={() => {
        const newVal = currentSortValue === descValue ? askValue : descValue;
        onChange(newVal);
      }}
    >
      {name}
      {currentSortValue === askValue && <ArrowUp />}
      {currentSortValue === descValue && <ArrowDown />}
      {!currentSortValue && <ArrowUpDown />}
    </Button>
  );
}
