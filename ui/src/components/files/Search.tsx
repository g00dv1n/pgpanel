import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface SearchProps {
  q?: string;
  onSearch: (q: string) => void;
}

export function Search({ q: initQ = "", onSearch }: SearchProps) {
  const [q, setQ] = useState(initQ);

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
    <div className="flex flex-shrink-0 items-center gap-1">
      <Input
        type="search"
        placeholder="Search by file name"
        value={q}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch(q);
          }
        }}
        onChange={(e) => onChange(e.currentTarget.value)}
      />

      <Button type="submit" onClick={() => onSearch(q)}>
        Filter
      </Button>
    </div>
  );
}
