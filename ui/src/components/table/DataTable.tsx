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
import { ColumnSortable } from "./ColumnSortable";

interface DataTableProps {
  table: PgTable;
  rows: Row[];
  sortValue?: string[];
  selectedRows?: string[];
  isAllSelected?: boolean;
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

          const isRowSelected = isAllSelected || selectedRows.includes(rowKey);

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
  );
}

function cellValue(field: RowField) {
  const s = fieldToString(field);

  if (s.length < 80) {
    return s;
  }

  return s.slice(0, 40) + "...";
}
