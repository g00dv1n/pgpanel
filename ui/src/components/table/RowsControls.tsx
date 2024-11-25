import { Button } from "@/components/ui/button";
import { Plus, Trash, X } from "lucide-react";

interface RowsControlsProps {
  selectedCount: number;
  onInsert: () => void;
  onDelete: () => void;
  onReset: () => void;
}

export function RowsControls({
  selectedCount,
  onInsert,
  onDelete,
  onReset,
}: RowsControlsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={() => onInsert()}>
        <Plus />
      </Button>
      {selectedCount > 0 && (
        <>
          <Button variant="destructive" onClick={() => onDelete()}>
            <Trash />
            Delete selected: {selectedCount}
          </Button>
          <Button size="icon" variant="outline" onClick={() => onReset()}>
            <X />
          </Button>
        </>
      )}
    </div>
  );
}
