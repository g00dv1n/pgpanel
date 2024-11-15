import { DBTable } from "@/api/data";
import { SqlFiltersInput } from "@/components/SqlFiltersInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

interface TableFiltersSearchProps {
  q?: string;
  table: DBTable;
  onSearch: (q: string) => void;
}

export function TableFiltersSearch({
  q: initQ = "",
  table,
  onSearch,
}: TableFiltersSearchProps) {
  const [q, setQ] = useState(initQ);
  const [sqlMode, setSqlMode] = useState(false);

  useEffect(() => {
    setQ(initQ);
  }, [initQ]);

  const onChange = (newQ: string) => {
    setQ(newQ);

    if (newQ.length === 0) {
      onSearch("");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {!sqlMode && (
        <Input
          type="search"
          placeholder="Search term (filter by text fields)"
          value={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(q);
            }
          }}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      )}

      {sqlMode && (
        <SqlFiltersInput
          placeholder="id = 1 OR ..."
          table={table}
          value={q}
          onChange={onChange}
          onEnter={() => onSearch(q)}
        />
      )}

      <Button type="submit" onClick={() => onSearch(q)}>
        Filter
      </Button>
      <div className="ml-10 flex items-center space-x-2 w-56">
        <Switch
          className="data-[state=checked]:bg-blue-500"
          id="sql-mode"
          checked={sqlMode}
          onCheckedChange={() => setSqlMode(!sqlMode)}
        />
        <Label htmlFor="sql-mode">SQL Mode</Label>
      </div>
    </div>
  );
}
