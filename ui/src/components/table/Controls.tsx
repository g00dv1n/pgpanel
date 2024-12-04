import { Button } from "@/components/ui/button";
import { Plus, Settings, Trash, X } from "lucide-react";

interface ControlsProps {
  selectedCount: number;
  onSettings: () => void;
  onInsert: () => void;
  onDelete: () => void;
  onReset: () => void;
}

export function Controls({
  selectedCount,
  onSettings,
  onInsert,
  onDelete,
  onReset,
}: ControlsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={() => onSettings()}>
        <Settings />
      </Button>

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
