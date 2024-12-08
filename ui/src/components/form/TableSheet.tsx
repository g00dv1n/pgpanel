import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable } from "@/lib/pgTypes";

import { TableSettingsForm } from "@/components/form/TableSettingsForm";
import { Separator } from "@/components/ui/separator";
import { TableSettings } from "@/lib/tableSettings";
import { createContext, ReactNode, useContext, useState } from "react";

interface TableSheetProps {
  table: PgTable;
  tableSettings: TableSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TableSheet({
  table,
  tableSettings,
  open,
  onOpenChange,
  onSuccess,
}: TableSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader className="pr-10 pl-2">
          <SheetTitle>{table.name} settings</SheetTitle>
        </SheetHeader>

        <Separator className="mt-2 mb-5" />
        <div className="pr-10 pl-2 max-h-[80vh] min-h-[50vh] overflow-scroll scroll-auto">
          <TableSettingsForm
            table={table}
            setttings={tableSettings}
            onSettingsUpdate={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type OpenTableSheetProps = Pick<
  TableSheetProps,
  "table" | "tableSettings" | "onSuccess"
>;

// Define the context type
interface TableSheetContextType {
  openTableSheet: (props: OpenTableSheetProps) => void;
  closeTableSheet: () => void;
}

// Create the context
const TableSheetContext = createContext<TableSheetContextType | undefined>(
  undefined
);

// Provider component
export function TableSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetProps, setSheetProps] = useState<OpenTableSheetProps | undefined>(
    undefined
  );

  const openTableSheet = (props: OpenTableSheetProps) => {
    setSheetProps(props);
    setIsOpen(true);
  };

  const closeTableSheet = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    closeTableSheet();

    if (sheetProps?.onSuccess) {
      sheetProps.onSuccess();
    }
  };

  return (
    <TableSheetContext.Provider value={{ openTableSheet, closeTableSheet }}>
      {children}
      {sheetProps && (
        <TableSheet
          {...sheetProps}
          open={isOpen}
          onOpenChange={setIsOpen}
          onSuccess={handleSuccess}
        />
      )}
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
