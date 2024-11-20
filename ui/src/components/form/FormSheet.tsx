import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable, Row } from "@/lib/pgTypes";

interface FormSheetProps {
  table: PgTable;
  row?: Row;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FormSheet({ table, open, onOpenChange }: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[calc(100vh-10%)]">
        <SheetHeader>
          <SheetTitle>Edit {table.name} row</SheetTitle>
          <SheetDescription>
            Make changes to your {table.name} row here. Click save when you're
            done.
          </SheetDescription>
        </SheetHeader>
        <div></div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
