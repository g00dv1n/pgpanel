import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fieldToString, Row } from "@/lib/pgTypes";

interface SqlTableProps {
  columns: string[];
  rows: Row[];
}

export function SqlTable({ columns, rows }: SqlTableProps) {
  return (
    <Table className="border">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 bg-[#e2f2ff]">#</TableHead>
          {columns.map((columnName) => {
            return <TableHead key={columnName}>{columnName}</TableHead>;
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          return (
            <TableRow key={i}>
              <TableCell className="bg-[#e2f2ff]">{i + 1}</TableCell>
              {columns.map((columnName) => {
                const value = row[columnName];

                return (
                  <TableCell
                    key={`${i}-${columnName}`}
                    className="overflow-hidden whitespace-nowrap max-w-14"
                  >
                    {fieldToString(value)}
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
