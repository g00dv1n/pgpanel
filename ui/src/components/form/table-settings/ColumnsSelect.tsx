import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PgColumn } from "@/lib/pgTypes";

interface TableViewColumnsSelectProps {
  columns: PgColumn[];
  selected?: string[];
  onChange?: (selectColumns: string[]) => void;
}

export function ColumnsSelect({
  columns,
  selected: selectedInit,
  onChange = () => {},
}: TableViewColumnsSelectProps) {
  // if selectedInit is undefined set all cols as selected
  const selected = selectedInit ?? columns.map((c) => c.name);

  return (
    <div className="grid gap-2">
      {columns.map((c) => {
        const checked = selected.includes(c.name);

        return (
          <div key={c.name} className="flex items-center space-x-2">
            <Switch
              checked={checked}
              onCheckedChange={(newChecked) => {
                if (newChecked) {
                  onChange([...selected, c.name]);
                } else {
                  onChange(selected.filter((cn) => c.name !== cn));
                }
              }}
            />
            <Label>{c.name}</Label>
          </div>
        );
      })}
    </div>
  );
}
