import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PgTable } from "@/lib/pgTypes";
import { useState } from "react";
import { SqlFiltersInput } from "./SqlFiltersInput";

interface FiltersSearchProps {
  q?: string;
  table: PgTable;
  sqlMode?: boolean;
  onSearch: (q: string, sqlMode: boolean) => void;
}

export function FiltersSearch({
  q: initQ = "",
  sqlMode: initsqlMode = false,
  table,
  onSearch,
}: FiltersSearchProps) {
  const [q, setQ] = useState(initQ);
  const [sqlMode, setSqlMode] = useState(initsqlMode);

  const toggleMode = () => {
    setSqlMode(!sqlMode);
    onChange("");
  };

  const onChange = (newQ: string) => {
    setQ(newQ);

    if (newQ.length === 0) {
      onSearch("", sqlMode);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      {!sqlMode && (
        <Input
          type="search"
          placeholder="Search term (filter by text fields)"
          value={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(q, sqlMode);
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
          onChange={(v) => onChange(v)}
          onEnter={() => onSearch(q, sqlMode)}
        />
      )}

      <Button type="submit" onClick={() => onSearch(q, sqlMode)}>
        Filter
      </Button>
      <div className="ml-10 flex items-center space-x-2 w-56">
        <Switch
          className="data-[state=checked]:bg-blue-500"
          id="sql-mode"
          checked={sqlMode}
          onCheckedChange={() => toggleMode()}
        />
        <Label htmlFor="sql-mode">SQL Mode</Label>
      </div>
    </div>
  );
}
