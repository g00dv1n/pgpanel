import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable } from "@/lib/pgTypes";

import { TableSettings } from "@/api/schema";
import { Separator } from "@/components/ui/separator";
import { createContext, ReactNode, useContext, useState } from "react";

interface TableSheetProps {
  table?: PgTable;
  settings?: TableSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TableSheet({
  table,
  settings,
  open,
  onOpenChange,
}: TableSheetProps) {
  const contentReady = table && settings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {contentReady && (
        <SheetContent side="bottom">
          <SheetHeader className="pr-10 pl-2">
            <SheetTitle>{table.name} settings</SheetTitle>
          </SheetHeader>

          <Separator className="mt-2 mb-5" />
          <div className="pr-10 pl-2 max-h-[80vh] overflow-scroll scroll-auto"></div>
        </SheetContent>
      )}
    </Sheet>
  );
}

// Define the context type
interface TableSheetContextType {
  openTableSheet: (table: PgTable, settings: TableSettings) => void;
  closeTableSheet: () => void;
}

// Create the context
const TableSheetContext = createContext<TableSheetContextType | undefined>(
  undefined
);

// Provider component
export function TableSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<PgTable | undefined>(
    undefined
  );

  const openTableSheet = (table: PgTable) => {
    setCurrentTable(table);
    setIsOpen(true);
  };

  const closeTableSheet = () => {
    setIsOpen(false);
  };

  return (
    <TableSheetContext.Provider value={{ openTableSheet, closeTableSheet }}>
      {children}
      <TableSheet
        table={currentTable}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={closeTableSheet}
      />
    </TableSheetContext.Provider>
  );
}

export function useTableSheet() {
  const context = useContext(TableSheetContext);
  if (context === undefined) {
    throw new Error("useTableSheet must be used within a TableSheetProvider");
  }
  return context;
}
