import {
  GetTableRowsParams,
  getTableRows,
  parseQueryRowsParams,
  rowsParamsToSearchParams,
} from "@/api/data";
import { FormSheet } from "@/components/form/FormSheet";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { useLoaderDataTyped, useTablesMap } from "@/hooks/use-data";
import { Row } from "@/lib/pgTypes";
import { useState } from "react";

import { LoaderFunctionArgs, useNavigate } from "react-router-dom";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowsParams(url);
  const { rows, error } = await getTableRows(tableName, rowsParams);

  return { tableName, rowsParams, rows, error };
}

export default function TablePage() {
  const { tableName, rows, rowsParams, error } =
    useLoaderDataTyped<typeof loader>();
  const tablesMap = useTablesMap();
  const table = tablesMap[tableName];

  const navigate = useNavigate();

  const onRowsParamsChange = (newParams: GetTableRowsParams) => {
    const s = rowsParamsToSearchParams(newParams);
    navigate(`?${s}`);
  };

  const [isFormSheetOpen, setFormSheetOpenState] = useState(false);
  const [editRow, setEditRow] = useState<Row | undefined>(undefined);

  const openEditRow = (row: Row) => {
    setEditRow(row);
    setFormSheetOpenState(true);
  };

  return (
    <>
      <title>{`${table.name} - table `}</title>
      <div className="flex">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>
        <Pagination
          tableName={table.name}
          offset={rowsParams.offset}
          limit={rowsParams.limit}
          onChange={(offset, limit) => {
            onRowsParamsChange({
              ...rowsParams,
              offset,
              limit,
            });
          }}
        />
      </div>

      <div className="mt-10 max-w-[750px]">
        <FiltersSearch
          table={table}
          q={rowsParams.textFilters || rowsParams.filters}
          sqlMode={Boolean(rowsParams.filters)}
          onSearch={(q, sqlMode) => {
            const filters = sqlMode && q.length > 0 ? q : undefined;
            const textFilters = !sqlMode && q.length > 0 ? q : undefined;

            onRowsParamsChange({
              ...rowsParams,
              offset: 0,
              textFilters,
              filters,
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
              ...rowsParams,
              sort: [newSortVal],
            });
          }}
          onRowOpen={openEditRow}
        />
      </div>

      {error && (
        <div className="my-5 text-red-600 max-w-[750px]">{error.message}</div>
      )}

      <FormSheet
        table={table}
        row={editRow}
        open={isFormSheetOpen}
        onOpenChange={setFormSheetOpenState}
      />
    </>
  );
}
