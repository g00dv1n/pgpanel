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
  const isAllSelected = calcAllSelected(rows, selectedRows);
  const columns = table.columns.filter((c) => !hiddenColumns.includes(c.name));

  const maxCellSymbols = calcMaxCellSymbols(columns.length);

  return (
    <Table className="rounded-md border">
      <TableHeader>
        <TableRow>
          {showSelectAll ? (
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (onAllRowsSelect) {
                    onAllRowsSelect(
                      rows.map((r) => r.uniqueKey()),
                      Boolean(checked),
                    );
                  }
                }}
              />
            </TableHead>
          ) : (
            <TableHead />
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
                    {row.getAsString(c.name, maxCellSymbols)}
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

function calcAllSelected(rows: DataRow[], selectedKeys: string[]) {
  if (rows.length === 0) return false;

  for (const r of rows) {
    if (!selectedKeys.includes(r.uniqueKey())) {
      return false;
    }
  }

  return true;
}

function calcMaxCellSymbols(
  columnsCount: number,
  baseViewportWidth = 1440,
): number {
  // Minimum width we want to reserve for UI elements (checkboxes, padding, etc)
  const uiElementsWidth = 20;

  const maxLines = 3;

  // Minimum characters we want to show regardless of column count
  const minCharsPerCell = 30;

  // Average character width in pixels (approximate)
  const averageCharWidth = 8;

  // Calculate available width for content
  const availableWidth = baseViewportWidth - uiElementsWidth;

  // Calculate approximate width per column
  const widthPerColumn = (availableWidth / columnsCount) * maxLines;

  // Calculate max chars that can fit in the column width
  const maxCharsPerColumn = Math.floor(widthPerColumn / averageCharWidth);

  // Return the larger of our minimum chars or calculated value
  return Math.max(minCharsPerCell, maxCharsPerColumn);
}
