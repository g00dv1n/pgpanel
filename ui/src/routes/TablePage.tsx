import {
  GetTableRowParams,
  getTableRows,
  parseQueryRowParams,
  rowParamsToSearchParams,
} from "@/api/data";
import { DataTable } from "@/components/DataTable";
import { TablePagination } from "@/components/TablePagination";
import { TableTextSearch } from "@/components/TableTextSearch";
import { useLoaderDataTyped, useTablesMap } from "@/hooks/use-data";
import { searchByTextColumnsFilters } from "@/lib/filters";
import { LoaderFunctionArgs, useNavigate } from "react-router-dom";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowParams(url);
  const rows = await getTableRows(tableName, rowsParams);

  return { tableName, rowsParams, rows };
}

export default function TablePage() {
  const { tableName, rows, rowsParams } = useLoaderDataTyped<typeof loader>();
  const tablesMap = useTablesMap();
  const table = tablesMap[tableName];

  const navigate = useNavigate();

  const onRowsParamsChange = (newParams: GetTableRowParams) => {
    const s = rowParamsToSearchParams(newParams);

    navigate(`?${s.toString()}`);
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
              filters: rowsParams.filters,
              sort: rowsParams.sort,
              offset,
              limit,
            });
          }}
        />
      </div>

      <div className="mt-10">
        <TableTextSearch
          onSearch={(q) => {
            const filters =
              q.length > 0 ? searchByTextColumnsFilters(q, table) : undefined;

            onRowsParamsChange({
              offset: rowsParams.offset,
              limit: rowsParams.limit,
              sort: rowsParams.sort,
              filters: filters,
            });
          }}
        />
      </div>

      <div className="rounded-md border mt-5">
        <DataTable
          table={table}
          rows={rows}
          sortValue={rowsParams.sort}
          onSortChange={(newSortVal) => {
            onRowsParamsChange({
              offset: rowsParams.offset,
              limit: rowsParams.limit,
              filters: rowsParams.filters,
              sort: [newSortVal],
            });
          }}
        />
      </div>
    </>
  );
}
