import { DbTablesMapContext, getTableRows, Row, RowField } from "@/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContext } from "react";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
  return getTableRows(params.tableName || "");
}

export default function TablePage() {
  const { tableName = "" } = useParams();
  const tablesMap = useContext(DbTablesMapContext);
  const table = tablesMap[tableName];
  const dataRows = useLoaderData() as Row[];

  return (
    <>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {table.name}
      </h1>

      <div className="rounded-md border mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              {table.columns.map((c) => {
                return <TableHead>{c.name}</TableHead>;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((row, i) => (
              <TableRow key={tableName + "_row_" + i}>
                {table.columns.map((c) => {
                  return (
                    <TableCell>{printRowFieldSafe(row[c.name])}</TableCell>
                  );
                })}
              </TableRow>
            ))}
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

  if (s.length < 120) {
    return s;
  }

  return s.slice(0, 120) + "...";
}
