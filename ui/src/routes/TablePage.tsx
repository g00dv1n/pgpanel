import { getTableRows, parseQueryRowParams } from "@/api/admin";
import { DataTable } from "@/components/DataTable";
import { TableControls } from "@/components/TableControls";
import { useLoaderDataTyped, useTablesMap } from "@/hooks/use-data";
import { LoaderFunctionArgs } from "react-router-dom";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = { tableName, ...parseQueryRowParams(url) };
  const rows = await getTableRows(rowsParams);

  return { rowsParams, rows };
}

export default function TablePage() {
  const { rows, rowsParams } = useLoaderDataTyped<typeof loader>();

  const tablesMap = useTablesMap();
  const table = tablesMap[rowsParams.tableName];

  return (
    <>
      <title>{`${table.name} - table `}</title>
      <div className="flex">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>
        <TableControls {...rowsParams} />
      </div>

      <div className="rounded-md border mt-10">
        <DataTable table={table} rows={rows} sortValue={rowsParams.sort} />
      </div>
    </>
  );
}
