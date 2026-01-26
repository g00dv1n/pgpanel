import { getRelatedRows, getTableRows, GetTableRowsParams, updateRelatedRows } from "@/api/data";
import { getTableSettings } from "@/api/schema";
import { CellViewDialog } from "@/components/table/CellViewDialog";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";
import { fieldToString } from "@/lib/pgTypes";
import { RelationsConfig } from "@/lib/tableSettings";
import { X } from "lucide-react";
import { useState } from "react";

import {
  data,
  LoaderFunctionArgs,
  NavLink,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "react-router";

const DefaultRowsParams: GetTableRowsParams = { offset: 0, limit: 50 };

async function getMainTableRow(tableName: string, idKey: string, idVal: any) {
  const params: GetTableRowsParams = {
    offset: 0,
    limit: 1,
    filters: `${idKey}=${idVal}`,
  };

  const { rows, error } = await getTableRows(tableName, params);

  return { row: rows.at(0), error };
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const mainTableName = params.mainTableName;
  if (!mainTableName) throw data("Missing mainTableName param");

  const mainTableRowId = url.searchParams.get("mainTableRowId");
  if (!mainTableRowId) throw data("Missing mainTableRowId query param");

  const mainTableIdKey = url.searchParams.get("mainTableIdKey");
  if (!mainTableIdKey) throw data("Missing mainTableIdKey query param");

  const relationTableName = url.searchParams.get("relationTable");
  if (!relationTableName) throw data("Missing relationTable query param");

  const joinTableName = url.searchParams.get("joinTable");
  if (!joinTableName) throw data("Missing joinTable query param");

  const relationConfig: RelationsConfig = {
    mainTable: mainTableName,
    relationTable: relationTableName,
    joinTable: joinTableName,
    bidirectional: url.searchParams.get("bidirectional") === "true",
  };

  const [mainRowRes, settingsRes, rowsRes, relatedRowsRes] = await Promise.all([
    getMainTableRow(mainTableName, mainTableIdKey, mainTableRowId),
    getTableSettings(relationTableName),
    getTableRows(relationTableName, DefaultRowsParams),
    getRelatedRows(relationConfig, mainTableRowId),
  ]);

  const { row: mainRowRaw, error: mainRowError } = mainRowRes;
  const { rows: rowsRaw, error: rowsError } = rowsRes;
  const { tableSettings, error: settingsError } = settingsRes;
  const { rows: relatedRowsRaw, error: relatedRowsError } = relatedRowsRes;

  if (mainRowError) {
    throw data(mainRowError.message, { status: mainRowError.code });
  }

  if (!mainRowRaw) {
    throw data(`Can't get main row ${mainTableIdKey}=${mainTableRowId}`);
  }

  if (settingsError) {
    throw data(settingsError.message, { status: settingsError.code });
  }

  if (relatedRowsError) {
    throw data(relatedRowsError.message, { status: relatedRowsError.code });
  }

  return {
    relationConfig,
    mainTableRowId,
    mainTableIdKey,
    mainRowRaw,
    tableSettings,
    rowsRaw,
    relatedRowsRaw,
    rowsError,
  };
}

export function RelationsPage() {
  const {
    relationConfig,
    mainTableIdKey,
    mainTableRowId,
    mainRowRaw,
    rowsRaw,
    relatedRowsRaw,
    tableSettings,
  } = useLoaderData<typeof loader>();
  const relationsName = relationConfig.joinTable;

  const mainTable = useTable(relationConfig.mainTable);
  const relatedTable = useTable(relationConfig.relationTable);

  const mainRow = new DataRow(mainTable, mainRowRaw);

  const [rows, setRows] = useState(DataRow.fromArray(relatedTable, rowsRaw));
  const [rowsParams, setRowsParams] = useState(DefaultRowsParams);

  const initRelatedRows = DataRow.fromArray(relatedTable, relatedRowsRaw);

  const [selectedRows, setSelectedRows] = useState(initRelatedRows);
  const selectedRowsKeys = selectedRows.map((r) => r.uniqueKey());

  /// calculated arrays for update
  const updatedIds = selectedRows.map((sr) =>
    mainTableIdKey ? sr.get(mainTableIdKey) : sr.pKey(),
  );
  const initIds = initRelatedRows.map((rr) =>
    mainTableIdKey ? rr.get(mainTableIdKey) : rr.pKey(),
  );

  const actions = {
    addIds: updatedIds.filter((id) => !initIds.includes(id)),
    deleteIds: initIds.filter((id) => !updatedIds.includes(id)),
  };

  const showUpdateBtn = actions.addIds.length + actions.deleteIds.length > 0;

  const onRowSelect = (rowKey: string, selected: boolean) => {
    if (!selected) return onRowRemove(rowKey);

    const row = rows.find((r) => r.uniqueKey() === rowKey);

    if (!row) return;

    const alreadySelected = selectedRows.some((sr) => sr.isEq(row));

    if (alreadySelected) return;

    setSelectedRows([...selectedRows, row]);
  };

  const onRowsParamsChange = async (newParams: GetTableRowsParams) => {
    const res = await getTableRows(relatedTable.name, newParams);

    setRowsParams(newParams);
    setRows(DataRow.fromArray(relatedTable, res.rows));
  };

  const onRowRemove = (rowKey: string) => {
    setSelectedRows(selectedRows.filter((sr) => sr.uniqueKey() != rowKey));
  };

  const revalidator = useRevalidator();
  const onUpdate = async () => {
    const { error } = await updateRelatedRows(relationConfig, mainTableRowId, actions);

    if (error) {
      alert.error(error.message);
    } else {
      revalidator.revalidate();
      alert.success("Updated");
    }
  };

  // special value to show dialog on cell click
  const [viewCellValue, setViewCellValue] = useState<undefined | string>();

  return (
    <>
      <ScrollRestoration />
      <title>{`${relationsName} relations for ${mainRow.textLabel()}`}</title>
      <div className="flex items-center">
        <h1 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
          Relations {relationsName} for{" "}
          <NavLink className="text-2xl text-blue-600 underline" to={mainRow.updateLink()}>
            {mainRow.textLabel()}
          </NavLink>
        </h1>

        {showUpdateBtn && (
          <Button className="ml-5 bg-green-500 hover:bg-green-600" onClick={onUpdate}>
            Update
          </Button>
        )}
      </div>

      <h2 className="scroll-m-20 pb-2 text-xl font-normal tracking-tight first:mt-0">
        Linked Items:
      </h2>

      <div className="flex gap-3 my-4 flex-wrap">
        {selectedRows.map((row) => {
          const rowKey = row.uniqueKey();

          return (
            <Badge variant="outline" className="text-lg" key={rowKey}>
              <div
                className="mx-2 inline-flex items-center rounded-full p-0.5 hover:bg-gray-200 cursor-pointer"
                aria-label="Remove item"
                onClick={() => onRowRemove(rowKey)}
              >
                <X size={18} aria-hidden="true" />
              </div>
              {row.textLabel()}
            </Badge>
          );
        })}
      </div>

      <div className="my-5 flex">
        <div className="w-1/2">
          <FiltersSearch
            table={relatedTable}
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

      <DataTable
        table={relatedTable}
        rows={rows}
        hiddenColumns={tableSettings.tableViewHiddenColumns}
        showSelectAll={false}
        selectedRows={selectedRowsKeys}
        onRowSelect={onRowSelect}
        sortValue={rowsParams.sort}
        onSortChange={(newSortVal) => {
          onRowsParamsChange({
            ...rowsParams,
            sort: [newSortVal],
          });
        }}
        onRowClick={(_row, rowField) => {
          setViewCellValue(fieldToString(rowField));
        }}
      />

      <CellViewDialog value={viewCellValue} onClose={() => setViewCellValue(undefined)} />
    </>
  );
}
