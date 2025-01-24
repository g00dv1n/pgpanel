import { Button } from "@/components/ui/button";
import { Trash, X } from "lucide-react";

interface ControlsProps {
  selectedCount: number;
  onDelete: () => void;
  onReset: () => void;
}

export function Controls({ selectedCount, onDelete, onReset }: ControlsProps) {
  return (
    <div className="flex gap-2">
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
