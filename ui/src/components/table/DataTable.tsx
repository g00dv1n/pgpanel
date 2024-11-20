import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fieldToString, PgTable, Row, RowField } from "@/lib/pgTypes";
import { ColumnSortable } from "./ColumnSortable";

interface DataTableProps {
  table: PgTable;
  rows: Row[];
  sortValue?: string[];
  onSortChange?: (newSortVal: string) => void;
  onRowOpen?: (row: Row, table: PgTable) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  onSortChange,
  onRowOpen,
}: DataTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox />
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
        {rows.map((row, i) => {
          const rowKey = `${table.name}_row_${i}`;
          return (
            <TableRow
              key={rowKey}
              onClick={() => onRowOpen && onRowOpen(row, table)}
            >
              <TableCell>
                <Checkbox />
              </TableCell>
              {table.columns.map((c) => {
                const cellKey = `${rowKey}_${c.name}`;
                return (
                  <TableCell key={cellKey}>
                    {printRowFieldSafe(row[c.name])}
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

function printRowFieldSafe(field: RowField) {
  const s = fieldToString(field);

  if (s.length < 80) {
    return s;
  }

  return s.slice(0, 40) + "...";
}
