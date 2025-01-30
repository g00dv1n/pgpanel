import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PgTable, RowField } from "@/lib/pgTypes";

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
  onRowClick?: (row: DataRow, rowField: RowField) => void;
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
  const isAllSelected = CalcAllSelected(rows, selectedRows);
  const columns = table.columns.filter((c) => !hiddenColumns.includes(c.name));

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
          {columns.map((c) => {
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
              {columns.map((c) => {
                const cellKey = `${rowKey}-${c.name}`;
                return (
                  <TableCell
                    className="smart-table-cell"
                    key={cellKey}
                    onClick={() =>
                      onRowClick && onRowClick(row, row.get(c.name))
                    }
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

function CalcAllSelected(rows: DataRow[], selectedKeys: string[]) {
  for (const r of rows) {
    if (!selectedKeys.includes(r.uniqueKey())) {
      return false;
    }
  }

  return true;
}
