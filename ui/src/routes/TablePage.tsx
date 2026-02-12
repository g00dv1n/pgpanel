import { getTableView, parseQueryRowsParams } from "@/api/data";
import { TableViewManager } from "@/components/table/TableViewManager";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";

import { data, LoaderFunctionArgs, useLoaderData } from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowsParams(url);

  const { rows: rawRows, columns, error: rowsError } = await getTableView(tableName, rowsParams);

  if (rowsError && rowsError.code === 404) {
    throw data(rowsError.message, { status: rowsError.code });
  }

  return { tableName, rowsParams, rawRows, columns, rowsError };
}

export function TablePage() {
  const loaderData = useLoaderData<typeof loader>();
  const { tableName, columns, rowsParams, rowsError, rawRows } = loaderData;

  const table = useTable(tableName);
  const rows = DataRow.fromArray(table, rawRows);

  // Need to use a separate component to be able set the key to re-render it
  // after we user goes to a different table
  return (
    <TableViewManager
      key={table.name}
      table={table}
      selectColumns={columns}
      rows={rows}
      rowsParams={rowsParams}
      rowsErrorMessage={rowsError?.message}
    />
  );
}
