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
  showSelectAll?: boolean;
  sortValue?: string[];
  selectedRows?: string[];
  hiddenColumns?: string[];

  onSortChange?: (newSortVal: string) => void;
  onRowClick?: (row: DataRow) => void;
  onRowSelect?: (rowKey: string, selected: boolean) => void;
  onAllRowsSelect?: (rowKeys: string[], selected: boolean) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  showSelectAll = true,
  selectedRows = [],
  hiddenColumns = [],
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
          {showSelectAll ? (
            <TableHead>
              <Checkbox
                className="mr-2"
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (onAllRowsSelect) {
                    onAllRowsSelect(
                      rows.map((r) => r.uniqueKey()),
                      Boolean(checked)
                    );
                  }
                }}
              />
            </TableHead>
          ) : (
            <TableHead className="mx-5" />
          )}
          {table.columns.map((c) => {
            if (hiddenColumns.includes(c.name)) return <></>;

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
          const rowKey = row.uniqueKey();

          const isRowSelected = isAllSelected || selectedRows.includes(rowKey);

          return (
            <TableRow key={rowKey}>
              <TableCell className="py-0">
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
                if (hiddenColumns.includes(c.name)) return <></>;

                const cellKey = `${rowKey}-${c.name}`;
                return (
                  <TableCell
                    className="smart-table-cell"
                    key={cellKey}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {row.getAsString(c.name, 27)}
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
