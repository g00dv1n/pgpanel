import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface TableColumnSortableProps {
  name: string;
  sortValue?: string;
}

export function TableColumnSortable({
  name,
  sortValue,
}: TableColumnSortableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const askValue = name;
  const descValue = `-${name}`;

  const onSortTogle = () => {
    const newVal = sortValue === askValue ? descValue : askValue;

    searchParams.set("sort", newVal);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <Button variant="ghost" className="p-0" onClick={() => onSortTogle()}>
      {name}
      {sortValue === askValue && <ArrowUp />}
      {sortValue === descValue && <ArrowDown />}
      {!(sortValue === askValue || sortValue === descValue) && <ArrowUpDown />}
    </Button>
  );
}
