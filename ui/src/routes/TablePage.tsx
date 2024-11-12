import { getTableRows, RowField } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLoaderDataTyped, useTablesMap } from "@/hooks/use-data";
import { ArrowUpDown } from "lucide-react";
import { LoaderFunctionArgs, useParams } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
  return getTableRows(params.tableName || "");
}

export default function TablePage() {
  const { tableName = "" } = useParams();
  const tablesMap = useTablesMap();
  const table = tablesMap[tableName];
  const dataRows = useLoaderDataTyped<typeof loader>();

  return (
    <>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {table.name}
      </h1>

      <div className="rounded-md border mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox />
              </TableHead>
              {table.columns.map((c) => {
                return (
                  <TableHead key={c.name}>
                    <Button variant="ghost" className="p-0">
                      {c.name}
                      <ArrowUpDown />
                    </Button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((row, i) => {
              const rowKey = `${tableName}_row_${i}`;
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
      </div>
    </>
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
