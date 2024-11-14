import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex w-full max-w-sm items-center space-x-2">
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
    </div>
  );
}
