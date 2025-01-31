import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PgColumn } from "@/lib/pgTypes";

interface TableViewColumnsSelectProps {
  columns: PgColumn[];
  hiddenColumns?: string[];
  onChange?: (hiddenColumns: string[]) => void;
}

export function TableViewColumnsSelect({
  columns,
  hiddenColumns = [],
  onChange = () => {},
}: TableViewColumnsSelectProps) {
  return (
    <div className="grid gap-2">
      {columns.map((c) => {
        const checked = !hiddenColumns.includes(c.name);

        return (
          <div key={c.name} className="flex items-center space-x-2">
            <Switch
              checked={checked}
              onCheckedChange={(newChecked) => {
                if (newChecked) {
                  onChange(hiddenColumns.filter((cn) => c.name != cn));
                } else {
                  onChange([...hiddenColumns, c.name]);
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
