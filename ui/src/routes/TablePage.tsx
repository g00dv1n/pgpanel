import {
  deleteTableRowsByPkeys,
  getTableRows,
  GetTableRowsParams,
  parseQueryRowsParams,
  rowsParamsToSearchParams,
} from "@/api/data";
import { getTableSettings } from "@/api/schema";
import { useRowSheet } from "@/components/form/RowSheet";
import { useTableSheet } from "@/components/form/TableSheet";
import { Controls } from "@/components/table/Controls";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { alert } from "@/components/ui/global-alert";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";
import { useEffect, useState } from "react";

import {
  data,
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from "react-router";

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
  const rows = DataRow.fromArray(table, tableSettings, rawRows);

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

  const openEditRow = (row: DataRow) => {
    openRowSheet({
      table,
      tableSettings,
      row,
      onSuccess: refresh,
    });
  };

  const openInsertRow = () => {
    openRowSheet({
      table,
      tableSettings,
      onSuccess: refresh,
    });
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
      .filter((r) => selectedRowsKeys.includes(r.getUniqueKey()))
      .map((r) => r.getPKeys());

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
  const openTableSettings = () => {
    openTableSheet({
      table,
      tableSettings,
      onSuccess: refresh,
    });
  };

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

      <div className="mt-5">
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

      {rowsError && (
        <div className="my-5 text-red-600 max-w-[750px]">
          {rowsError.message}
        </div>
      )}
    </>
  );
}
