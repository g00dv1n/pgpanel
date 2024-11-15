import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

interface TableTextSearchProps {
  q?: string;
  onSearch: (q: string) => void;
}

export function TableTextSearch({
  q: initQ = "",
  onSearch,
}: TableTextSearchProps) {
  const [q, setQ] = useState(initQ);

  useEffect(() => {
    setQ(initQ);
  }, [initQ]);

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        type="search"
        placeholder="Search by text fields"
        value={q}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch(q);
          }
        }}
        onChange={(e) => {
          const newQ = e.currentTarget.value;
          setQ(newQ);

          if (newQ.length === 0) {
            onSearch("");
          }
        }}
      />
      <Button type="submit" onClick={() => onSearch(q)}>
        Search
      </Button>
      <div className="flex items-center space-x-2 w-56 ml-10">
        <Switch id="airplane-mode" />
        <Label htmlFor="airplane-mode">SQL Mode</Label>
      </div>
    </div>
  );
}
