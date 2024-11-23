import {
  GetTableRowsParams,
  getTableRows,
  parseQueryRowsParams,
  rowsParamsToSearchParams,
} from "@/api/data";
import { RowSheet } from "@/components/form/RowSheet";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { Button } from "@/components/ui/button";
import { useTablesMap } from "@/hooks/use-data";
import { Row } from "@/lib/pgTypes";
import { Plus } from "lucide-react";
import { useState } from "react";

import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowsParams(url);
  const { rows, error } = await getTableRows(tableName, rowsParams);

  return { tableName, rowsParams, rows, error };
}

export default function TablePage() {
  const { tableName, rows, rowsParams, error } = useLoaderData<typeof loader>();
  const tablesMap = useTablesMap();
  const table = tablesMap[tableName];

  const navigate = useNavigate();

  const onRowsParamsChange = (newParams: GetTableRowsParams) => {
    const s = rowsParamsToSearchParams(newParams);
    navigate(`?${s}`);
  };

  const refresh = () => {
    onRowsParamsChange(rowsParams);
  };

  const [openRowSheet, setOpenRowSheet] = useState(false);
  const [editRow, setEditRow] = useState<Row | undefined>(undefined);

  const openEditRow = (row: Row) => {
    setEditRow(row);
    setOpenRowSheet(true);
  };

  const openInsertRow = () => {
    setEditRow(undefined);
    setOpenRowSheet(true);
  };

  return (
    <>
      <title>{`${table.name} - table `}</title>
      <div className="flex items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>
        <Button
          className="mx-5 p-0"
          variant="outline"
          size="icon"
          onClick={() => openInsertRow()}
        >
          <Plus className="h-5 w-5" />
        </Button>
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

      <RowSheet
        table={table}
        row={editRow}
        open={openRowSheet}
        onSuccess={() => {
          setOpenRowSheet(false);
          refresh();
        }}
        onOpenChange={setOpenRowSheet}
      />
    </>
  );
}
