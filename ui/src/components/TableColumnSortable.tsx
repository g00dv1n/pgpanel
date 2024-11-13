import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface TableColumnSortableProps {
  name: string;
  sortValue?: string;
  onChange: (newVal: string) => void;
}

export function TableColumnSortable({
  name,
  sortValue,
  onChange,
}: TableColumnSortableProps) {
  const askValue = name;
  const descValue = `-${name}`;

  return (
    <Button
      variant="ghost"
      className="p-0"
      onClick={() => {
        const newVal = sortValue === askValue ? descValue : askValue;
        onChange(newVal);
      }}
    >
      {name}
      {sortValue === askValue && <ArrowUp />}
      {sortValue === descValue && <ArrowDown />}
      {!(sortValue === askValue || sortValue === descValue) && <ArrowUpDown />}
    </Button>
  );
}
