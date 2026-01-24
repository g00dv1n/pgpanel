import { getTableRows, parseQueryRowsParams } from "@/api/data";
import { getTableSettings } from "@/api/schema";
import { TableViewManager } from "@/components/table/TableViewManager";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";

import { data, LoaderFunctionArgs, useLoaderData } from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowsParams(url);

  const [settingsRes, rowsRes] = await Promise.all([
    getTableSettings(tableName),
    getTableRows(tableName, rowsParams),
  ]);

  const { rows: rawRows, error: rowsError } = rowsRes;
  const { tableSettings, error: settingsError } = settingsRes;

  if (settingsError) {
    throw data(settingsError.message, { status: settingsError.code });
  }

  return { tableName, tableSettings, rowsParams, rawRows, rowsError };
}

export function TablePage() {
  const loaderData = useLoaderData<typeof loader>();
  const { tableName, tableSettings, rowsParams, rowsError, rawRows } =
    loaderData;

  const table = useTable(tableName);
  const rows = DataRow.fromArray(table, rawRows);

  // Need to use a separate component to be able set the key to re-render it
  // after we user goes to a different table
  return (
    <TableViewManager
      key={table.name}
      table={table}
      tableSettings={tableSettings}
      rows={rows}
      rowsParams={rowsParams}
      rowsErrorMessage={rowsError?.message}
    />
  );
}
