import { CellViewDialog } from "@/components/table/CellViewDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fieldToString, Row } from "@/lib/pgTypes";
import { useState } from "react";

interface SqlTableProps {
  columns: string[];
  rows: Row[];
}

export function SqlTable({ columns, rows }: SqlTableProps) {
  const [viewValue, setViewValue] = useState<undefined | string>();

  return (
    <>
      <CellViewDialog
        value={viewValue}
        onClose={() => setViewValue(undefined)}
      />
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
                  const value = fieldToString(row[columnName]);

                  return (
                    <TableCell
                      key={`${i}-${columnName}`}
                      className="cursor-pointer max-w-14 truncate"
                      onClick={() => setViewValue(value)}
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
