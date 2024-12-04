import {
  deleteTableRowsByPkeys,
  getTableRows,
  GetTableRowsParams,
  parseQueryRowsParams,
  rowsParamsToSearchParams,
} from "@/api/data";
import { useRowSheet } from "@/components/form/RowSheet";
import { useTableSheet } from "@/components/form/TableSheet";
import { Controls } from "@/components/table/Controls";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { alert } from "@/components/ui/global-alert";
import { useTablesMap } from "@/hooks/use-tables";
import { getPKeys, getRowKey, Row } from "@/lib/pgTypes";
import { useEffect, useState } from "react";

import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const url = new URL(request.url);
  const rowsParams = parseQueryRowsParams(url);
  const { rows, error } = await getTableRows(tableName, rowsParams);

  return { tableName, rowsParams, rows, error };
}

export function TablePage() {
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

  // INSERT & EDIT
  const { openRowSheet } = useRowSheet();

  const onRowSuccess = () => refresh();

  const openEditRow = (row: Row) => {
    openRowSheet(table, onRowSuccess, row);
  };

  const openInsertRow = () => {
    openRowSheet(table, onRowSuccess);
  };

  // Rows selection logic
  const [selectedRowsKeys, setSelectedRowsKeys] = useState<string[]>([]);

  useEffect(() => {
    setSelectedRowsKeys([]);
  }, [tableName, rowsParams]);

  const onRowSelect = (rowKey: string, selected: boolean) => {
    if (selected) {
      setSelectedRowsKeys([...selectedRowsKeys, rowKey]);
    } else {
      setSelectedRowsKeys(selectedRowsKeys.filter((rk) => rk !== rowKey));
    }
  };

  const onAllRowsSelect = (rowKeys: string[], selected: boolean) => {
    if (selected) {
      setSelectedRowsKeys(rowKeys);
    } else {
      setSelectedRowsKeys([]);
    }
  };

  const onDeleteSelected = async () => {
    const selectedRowsPkeys = rows
      .filter((r) => selectedRowsKeys.includes(getRowKey(table, r)))
      .map((r) => getPKeys(table, r));

    const { error } = await deleteTableRowsByPkeys(
      tableName,
      selectedRowsPkeys
    );

    if (error) {
      alert.error(`Can't delete rows: ${error.message}`);
    } else {
      alert.success("Deleted successfully");
      refresh();
    }
  };
  //

  // Table settings
  const { openTableSheet } = useTableSheet();

  const openTableSettings = () => openTableSheet(table);

  return (
    <>
      <title>{`${table.name} - table `}</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {table.name}
        </h1>

        <Controls
          selectedCount={selectedRowsKeys.length}
          onSettings={openTableSettings}
          onInsert={openInsertRow}
          onDelete={onDeleteSelected}
          onReset={() => setSelectedRowsKeys([])}
        />
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
          selectedRows={selectedRowsKeys}
          onSortChange={(newSortVal) => {
            onRowsParamsChange({
              ...rowsParams,
              sort: [newSortVal],
            });
          }}
          onRowOpen={openEditRow}
          onRowSelect={onRowSelect}
          onAllRowsSelect={onAllRowsSelect}
        />
      </div>

      {error && (
        <div className="my-5 text-red-600 max-w-[750px]">{error.message}</div>
      )}
    </>
  );
}
