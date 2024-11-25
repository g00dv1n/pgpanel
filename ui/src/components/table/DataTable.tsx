import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fieldToString, getPKeys, PgTable, Row, RowField } from "@/lib/pgTypes";
import { ColumnSortable } from "./ColumnSortable";

interface DataTableProps {
  table: PgTable;
  rows: Row[];
  sortValue?: string[];
  onSortChange?: (newSortVal: string) => void;
  onRowOpen?: (row: Row) => void;
  onSelect?: (rows: Row[]) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  onSortChange,
  onRowOpen,
}: DataTableProps) {
  const openRow = (row: Row) => {
    if (onRowOpen) {
      onRowOpen(row);
    }
  };

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
        {rows.map((row) => {
          const pk = getPKeys(table, row);
          const rowKey = `${table.name}-${Object.values(pk).join("-")}`;

          return (
            <TableRow className="cursor-pointer" key={rowKey}>
              <TableCell>
                <Checkbox />
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
