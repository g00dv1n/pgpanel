import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface TableTextSearchProps {
  onSearch: (q: string) => void;
}

export function TableTextSearch({ onSearch }: TableTextSearchProps) {
  const [q, setQ] = useState("");

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="search"
        placeholder="Search by text fields"
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
