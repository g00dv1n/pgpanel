import { getTableRows, RowField } from "@/api/admin";
import { TableControls } from "@/components/TableControls";
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
import { LoaderFunctionArgs } from "react-router-dom";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);
  const rowsParams = { tableName, offset, limit };
  const rows = await getTableRows(rowsParams);

  return { rowsParams, rows };
}

export default function TablePage() {
  const data = useLoaderDataTyped<typeof loader>();
  const tableName = data.rowsParams.tableName;

  const tablesMap = useTablesMap();
  const table = tablesMap[tableName];

  return (
    <>
      <div className="flex">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>
        <TableControls {...data.rowsParams} />
      </div>

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
            {data.rows.map((row, i) => {
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
