import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable, Row } from "@/lib/pgTypes";

import { RowForm } from "./RowForm";

interface FormSheetProps {
  table: PgTable;
  row?: Row;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FormSheet({ table, row, open, onOpenChange }: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[calc(100vh-120px)] overflow-scroll"
      >
        <SheetHeader>
          <SheetTitle>Edit {table.name} row</SheetTitle>
        </SheetHeader>
        <div className="my-10">
          <RowForm table={table} row={row} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
