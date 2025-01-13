import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PgTable } from "@/lib/pgTypes";

import { DataRow } from "@/lib/dataRow";
import { ColumnSortable } from "./ColumnSortable";

interface DataTableProps {
  table: PgTable;
  rows: DataRow[];
  showSelects?: boolean;
  sortValue?: string[];
  selectedRows?: string[];

  onSortChange?: (newSortVal: string) => void;
  onRowClick?: (row: DataRow) => void;
  onRowSelect?: (rowKey: string, selected: boolean) => void;
  onAllRowsSelect?: (rowKeys: string[], selected: boolean) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  showSelects = true,
  selectedRows = [],
  onSortChange,
  onRowClick,
  onRowSelect,
  onAllRowsSelect,
}: DataTableProps) {
  const isAllSelected = rows.length > 0 && selectedRows.length === rows.length;

  return (
    <Table className="rounded-md border">
      <TableHeader>
        <TableRow>
          {showSelects && (
            <TableHead>
              <Checkbox
                className="mr-5"
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (onAllRowsSelect) {
                    onAllRowsSelect(
                      rows.map((r) => r.getUniqueKey()),
                      Boolean(checked)
                    );
                  }
                }}
              />
            </TableHead>
          )}
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
          const rowKey = row.getUniqueKey();

          const isRowSelected = isAllSelected || selectedRows.includes(rowKey);

          return (
            <TableRow key={rowKey}>
              {showSelects && (
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
              )}
              {table.columns.map((c) => {
                const cellKey = `${rowKey}-${c.name}`;
                return (
                  <TableCell
                    className="cursor-pointer"
                    key={cellKey}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {cellValue(row.getAsString(c.name))}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function cellValue(s: string) {
  if (s.length < 80) {
    return s;
  }

  return s.slice(0, 40) + "...";
}
