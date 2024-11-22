import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable, Row } from "@/lib/pgTypes";

import { Separator } from "@/components/ui/separator";
import { RowForm } from "./RowForm";

interface RowSheetProps {
  table: PgTable;
  row?: Row;
  open: boolean;
  onSuccess: (row: Row) => void;
  onOpenChange: (open: boolean) => void;
}

export function RowSheet({
  table,
  row,
  open,
  onOpenChange,
  onSuccess,
}: RowSheetProps) {
  const mode = row ? "update" : "insert";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader className="pr-10 pl-2">
          <SheetTitle>
            {mode} {table.name} row
          </SheetTitle>
        </SheetHeader>

        <Separator className="mt-2 mb-5" />
        <div className="pr-10 pl-2 max-h-[80vh] overflow-scroll scroll-auto">
          <RowForm
            table={table}
            mode={mode}
            row={row}
            onRowUpdate={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
