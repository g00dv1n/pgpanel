import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface TableColumnSortableProps {
  name: string;
  sortValue?: string[];
  onChange: (newVal: string) => void;
}

export function TableColumnSortable({
  name,
  sortValue = [],
  onChange,
}: TableColumnSortableProps) {
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
        const newVal = currentSortValue === askValue ? descValue : askValue;
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
