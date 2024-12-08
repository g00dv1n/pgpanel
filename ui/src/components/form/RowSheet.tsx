import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PgTable } from "@/lib/pgTypes";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataRow } from "@/lib/dataRow";
import { TableSettings } from "@/lib/tableSettings";
import { ExternalLink } from "lucide-react";
import { createContext, ReactNode, useContext, useState } from "react";
import { RowForm } from "./RowForm";

interface RowSheetProps {
  table: PgTable;
  tableSettings: TableSettings;
  row?: DataRow;
  open: boolean;
  onSuccess: () => void;
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
  const viewLink = row?.viewLink();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader className="pr-10 pl-2">
          <SheetTitle className="flex gap-3 items-baseline">
            <div>
              {mode} {table.name} row
            </div>
            {viewLink && (
              <Button className="text-blue-600" variant="link" asChild>
                <a href={viewLink} target="_blank">
                  {viewLink} <ExternalLink />
                </a>
              </Button>
            )}
          </SheetTitle>
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

export type OpenRowSheetProps = Pick<
  RowSheetProps,
  "table" | "tableSettings" | "row" | "onSuccess"
>;

// Define the context type
interface RowSheetContextType {
  openRowSheet: (sheetProps: OpenRowSheetProps) => void;
  closeRowSheet: () => void;
}

// Create the context
const RowSheetContext = createContext<RowSheetContextType | undefined>(
  undefined
);

// Provider component
export function RowSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetProps, setSheetProps] = useState<OpenRowSheetProps | undefined>(
    undefined
  );

  const openRowSheet = (props: OpenRowSheetProps) => {
    setSheetProps(props);
    setIsOpen(true);
  };

  const closeRowSheet = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    closeRowSheet();

    if (sheetProps?.onSuccess) {
      sheetProps.onSuccess();
    }
  };

  return (
    <RowSheetContext.Provider value={{ openRowSheet, closeRowSheet }}>
      {children}
      {sheetProps && (
        <RowSheet
          {...sheetProps}
          open={isOpen}
          onOpenChange={setIsOpen}
          onSuccess={handleSuccess}
        />
      )}
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
