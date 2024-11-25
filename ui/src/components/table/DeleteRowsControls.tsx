import { Button } from "@/components/ui/button";
import { Trash, X } from "lucide-react";

interface DeleteRowsControlsProps {
  count: number;
  onDelete: () => void;
  onReset: () => void;
}

export function DeleteRowsControls({
  count,
  onDelete,
  onReset,
}: DeleteRowsControlsProps) {
  if (count === 0) return <></>;

  return (
    <div className="flex gap-2">
      <Button variant="destructive" onClick={() => onDelete()}>
        <Trash />
        Delete selected: {count}
      </Button>
      <Button size="icon" variant="outline" onClick={() => onReset()}>
        <X />
      </Button>
    </div>
  );
}
