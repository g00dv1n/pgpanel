import { getTableRows, parseQueryRowParams } from "@/api/admin";
import { DataTable } from "@/components/DataTable";
import { TablePagination } from "@/components/TablePagination";
import { useLoaderDataTyped, useTablesMap } from "@/hooks/use-data";
import { LoaderFunctionArgs, useNavigate } from "react-router-dom";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = { tableName, ...parseQueryRowParams(url) };
  const rows = await getTableRows(rowsParams);

  return { rowsParams, rows };
}

export default function TablePage() {
  const navigate = useNavigate();
  const { rows, rowsParams } = useLoaderDataTyped<typeof loader>();

  const tablesMap = useTablesMap();
  const table = tablesMap[rowsParams.tableName];

  const onRowsParamsChange = (newParams: {
    offset: number;
    limit: number;
    sort?: string;
  }) => {
    const q = new URLSearchParams({
      offset: newParams.offset.toString(),
      limit: newParams.limit.toString(),
      sort: newParams.sort || "",
    });

    navigate(`/${table.name}?${q.toString()}`);
  };

  return (
    <>
      <title>{`${table.name} - table `}</title>
      <div className="flex">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>
        <TablePagination
          tableName={table.name}
          offset={rowsParams.offset}
          limit={rowsParams.limit}
          onChange={(offset, limit) => {
            onRowsParamsChange({
              offset,
              limit,
              sort: rowsParams.sort,
            });
          }}
        />
      </div>

      <div className="rounded-md border mt-10">
        <DataTable
          table={table}
          rows={rows}
          sortValue={rowsParams.sort}
          onSortChange={(newSortVal) => {
            onRowsParamsChange({
              offset: rowsParams.offset,
              limit: rowsParams.limit,
              sort: newSortVal,
            });
          }}
        />
      </div>
    </>
  );
}
