import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable, Row } from "@/lib/pgTypes";

import { Separator } from "@/components/ui/separator";
import { createContext, ReactNode, useContext, useState } from "react";
import { RowForm } from "./RowForm";

type OnSuccessFn = (row: Row) => void;

interface RowSheetProps {
  table?: PgTable;
  row?: Row;
  open: boolean;
  onSuccess: OnSuccessFn;
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
          {table && (
            <SheetTitle>
              {mode} {table.name} row
            </SheetTitle>
          )}
        </SheetHeader>

        <Separator className="mt-2 mb-5" />
        <div className="pr-10 pl-2 max-h-[80vh] overflow-scroll scroll-auto">
          {table && (
            <RowForm
              table={table}
              mode={mode}
              row={row}
              onRowUpdate={onSuccess}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Define the context type
interface RowSheetContextType {
  openRowSheet: (table: PgTable, onSuccess: OnSuccessFn, row?: Row) => void;
  closeRowSheet: () => void;
}

// Create the context
const RowSheetContext = createContext<RowSheetContextType | undefined>(
  undefined
);

// Provider component
export function RowSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<PgTable | undefined>(
    undefined
  );
  const [currentRow, setCurrentRow] = useState<Row | undefined>(undefined);
  const [successCallback, setSuccessCallback] = useState<
    OnSuccessFn | undefined
  >(undefined);

  const openRowSheet = (table: PgTable, onSuccess: OnSuccessFn, row?: Row) => {
    setCurrentTable(table);
    setCurrentRow(row);
    setSuccessCallback(() => onSuccess);
    setIsOpen(true);
  };

  const closeRowSheet = () => {
    setIsOpen(false);
  };

  const handleSuccess = (row: Row) => {
    closeRowSheet();

    if (successCallback) {
      successCallback(row);
    }
  };

  return (
    <RowSheetContext.Provider value={{ openRowSheet, closeRowSheet }}>
      {children}
      <RowSheet
        table={currentTable}
        row={currentRow}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
      />
    </RowSheetContext.Provider>
  );
}

// Custom hook to use the RowSheet context
export function useRowSheet() {
  const context = useContext(RowSheetContext);
  if (context === undefined) {
    throw new Error("useRowSheet must be used within a RowSheetProvider");
  }
  return context;
}
