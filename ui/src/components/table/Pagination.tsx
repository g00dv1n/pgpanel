import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface PaginationProps {
  tableName: string;
  offset: number;
  limit: number;
  onChange: (offset: number, limit: number) => void;
}

export function Pagination({
  tableName,
  offset: initOffset,
  limit: initLimit,
  onChange,
}: PaginationProps) {
  const [offset, setOffset] = useState(initOffset);
  const [limit, setLimit] = useState(initLimit);

  useEffect(() => {
    setOffset(initOffset);
    setLimit(initLimit);
  }, [tableName, initLimit, initOffset]);

  return (
    <div className="ml-auto flex gap-1">
      <Button
        variant="outline"
        size="icon"
        disabled={offset === 0}
        onClick={() => {
          let newOffset = offset - limit;
          if (newOffset < 0) {
            newOffset = 0;
          }

          setOffset(newOffset);
          onChange(newOffset, limit);
        }}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <div className="flex gap-1">
        <Input
          className="h-9 w-14 text-center"
          value={limit}
          onChange={(e) => {
            let newLimit = Number(e.currentTarget.value);
            if (newLimit > 500) {
              newLimit = 500;
            }
            if (newLimit < 1) {
              newLimit = 1;
            }

            setLimit(newLimit);
            onChange(offset, newLimit);
          }}
        />
        <Input
          className="h-9 w-14 text-center"
          value={offset}
          onChange={(e) => {
            let newOffset = Number(e.currentTarget.value);
            if (newOffset < 0) {
              newOffset = 0;
            }

            setOffset(newOffset);
            onChange(newOffset, limit);
          }}
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          const newOffset = offset + limit;
          setOffset(newOffset);
          onChange(newOffset, limit);
        }}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
      <Button
        className="ml-5"
        variant="outline"
        size="icon"
        onClick={() => onChange(offset, limit)}
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  );
}
