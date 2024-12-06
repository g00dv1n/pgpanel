import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fieldToString,
  getRowKey,
  PgTable,
  Row,
  RowField,
} from "@/lib/pgTypes";
import { Loader2 } from "lucide-react";
import { ColumnSortable } from "./ColumnSortable";

interface DataTableProps {
  table: PgTable;
  rows: Row[];
  sortValue?: string[];
  selectedRows?: string[];
  isLoading?: boolean;
  onSortChange?: (newSortVal: string) => void;
  onRowOpen?: (row: Row) => void;
  onRowSelect?: (rowKey: string, selected: boolean) => void;
  onAllRowsSelect?: (rowKeys: string[], selected: boolean) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  selectedRows = [],
  isLoading = false,
  onSortChange,
  onRowOpen,
  onRowSelect,
  onAllRowsSelect,
}: DataTableProps) {
  const openRow = (row: Row) => {
    if (onRowOpen) {
      onRowOpen(row);
    }
  };

  const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;

  return (
    <div className="relative rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                className="mr-5"
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (onAllRowsSelect) {
                    onAllRowsSelect(
                      rows.map((r) => getRowKey(table, r)),
                      Boolean(checked)
                    );
                  }
                }}
              />
            </TableHead>
            {table.columns.map((c) => {
              return (
                <TableHead key={c.name}>
                  <ColumnSortable
                    name={c.name}
                    sortValue={sortValue}
                    onChange={(v) => onSortChange && onSortChange(v)}
                  />
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const rowKey = getRowKey(table, row);

            const isRowSelected =
              isAllSelected || selectedRows.includes(rowKey);

            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <Checkbox
                    checked={isRowSelected}
                    onCheckedChange={(checked) => {
                      if (onRowSelect) {
                        onRowSelect(rowKey, Boolean(checked));
                      }
                    }}
                  />
                </TableCell>
                {table.columns.map((c) => {
                  const cellKey = `${rowKey}-${c.name}`;
                  return (
                    <TableCell
                      className="cursor-pointer"
                      key={cellKey}
                      onClick={() => openRow(row)}
                    >
                      {cellValue(row[c.name])}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {isLoading && <LoadingOverlay />}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-50 flex justify-center pt-2">
      <div className="bg-white/30 px-4 py-4 rounded-full shadow-sm flex items-center h-fit">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    </div>
  );
}

function cellValue(field: RowField) {
  const s = fieldToString(field);

  if (s.length < 80) {
    return s;
  }

  return s.slice(0, 40) + "...";
}
