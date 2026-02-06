import { deleteTableRowsByPkeys, GetTableRowsParams, paramsToURLSearchParams } from "@/api/data";
import { Controls } from "@/components/table/Controls";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { alert } from "@/components/ui/global-alert";
import { DataRow } from "@/lib/dataRow";
import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";
import { useState } from "react";

import { useNavigate } from "react-router";

interface TableViewManagerProps {
  table: PgTable;
  tableSettings: TableSettings;
  rowsParams: GetTableRowsParams;
  rows: DataRow[];
  rowsErrorMessage?: string;
}

export function TableViewManager({
  table,
  tableSettings,
  rowsParams,
  rows,
  rowsErrorMessage,
}: TableViewManagerProps) {
  const tableName = table.name;

  const selectColumns = table.columns.filter((c) =>
    tableSettings.tableViewSelectColumns.includes(c.name),
  );

  const navigate = useNavigate();

  const onRowsParamsChange = (newParams: GetTableRowsParams) => {
    const s = paramsToURLSearchParams(newParams);
    navigate(`?${s}`);
  };

  const refresh = () => {
    onRowsParamsChange(rowsParams);
  };

  // INSERT & EDIT
  const openEditRow = (row: DataRow) => {
    return navigate(row.updateLink());
  };

  const openInsertRow = () => {
    return navigate(`/${tableName}/row/insert`);
  };

  // Rows selection logic
  const [selectedRowsKeys, setSelectedRowsKeys] = useState<string[]>([]);

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
      .filter((r) => selectedRowsKeys.includes(r.uniqueKey()))
      .map((r) => r.pKeys());

    const { error } = await deleteTableRowsByPkeys(tableName, selectedRowsPkeys);

    if (error) {
      alert.error(`Can't delete rows: ${error.message}`);
    } else {
      alert.success("Deleted successfully");
      setSelectedRowsKeys([]);
      refresh();
    }
  };
  //

  // Table settings
  const openTableSettings = () => {
    return navigate(`/${tableName}/settings`);
  };

  return (
    <>
      <title>{`${tableName} - table `}</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {tableName}
        </h1>

        <Controls
          selectedCount={selectedRowsKeys.length}
          onSettings={openTableSettings}
          onInsert={openInsertRow}
          onDelete={onDeleteSelected}
          onReset={() => setSelectedRowsKeys([])}
        />
        <Pagination
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

      <div className="my-5 w-1/2">
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

      <DataTable
        columns={selectColumns}
        rows={rows}
        sortValue={rowsParams.sort}
        selectedRows={selectedRowsKeys}
        onSortChange={(newSortVal) => {
          onRowsParamsChange({
            ...rowsParams,
            sort: [newSortVal],
          });
        }}
        onRowClick={openEditRow}
        onRowSelect={onRowSelect}
        onAllRowsSelect={onAllRowsSelect}
      />

      {rowsErrorMessage && (
        <div className="my-5 text-red-600 max-w-[750px]">{rowsErrorMessage}</div>
      )}
    </>
  );
}
