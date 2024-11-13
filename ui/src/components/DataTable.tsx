import { DBTable, Row, RowField } from "@/api/admin";
import { TableColumnSortable } from "@/components/TableColumnSortable";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  table: DBTable;
  rows: Row[];
  sortValue?: string;
  onSortChange: (newSortVal: string) => void;
}

export function DataTable({
  table,
  rows,
  sortValue,
  onSortChange,
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
                <TableColumnSortable
                  name={c.name}
                  sortValue={sortValue}
                  onChange={onSortChange}
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
            <TableRow key={rowKey}>
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

function printRowField(field: RowField) {
  if (field === null) {
    return "NULL";
  }

  if (typeof field === "object") {
    return JSON.stringify(field);
  }

  return field.toString();
}

function printRowFieldSafe(field: RowField) {
  const s = printRowField(field);

  if (s.length < 80) {
    return s;
  }

  return s.slice(0, 40) + "...";
}
