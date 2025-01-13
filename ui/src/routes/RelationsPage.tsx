import {
  getRelatedRows,
  getTableRows,
  GetTableRowsParams,
  updateRelatedRows,
} from "@/api/data";
import { getTableSettings } from "@/api/schema";
import { DataTable } from "@/components/table/DataTable";
import { FiltersSearch } from "@/components/table/FiltersSearch";
import { Pagination } from "@/components/table/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";
import { RelationsConfig } from "@/lib/tableSettings";
import { X } from "lucide-react";
import { useState } from "react";

import { data, LoaderFunctionArgs, useLoaderData } from "react-router";

const DefaultRowsParams: GetTableRowsParams = { offset: 0, limit: 50 };

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const mainTableName = params.mainTableName || "";
  const mainTableRowId = params.mainTableRowId || "";
  const relationTableName = url.searchParams.get("relationTable") || "";
  const joinTableName = url.searchParams.get("joinTable") || "";

  const relationConfig: RelationsConfig = {
    mainTable: mainTableName,
    relationTable: relationTableName,
    joinTable: joinTableName,
  };

  const [settingsRes, rowsRes, relatedRowsRes] = await Promise.all([
    getTableSettings(relationTableName),
    getTableRows(relationTableName, DefaultRowsParams),
    getRelatedRows(relationConfig, mainTableRowId),
  ]);

  const { rows: rowsRaw, error: rowsError } = rowsRes;
  const { tableSettings, error: settingsError } = settingsRes;
  const { rows: relatedRowsRaw, error: relatedRowsError } = relatedRowsRes;

  if (settingsError) {
    throw data(settingsError.message, { status: settingsError.code });
  }

  if (relatedRowsError) {
    throw data(relatedRowsError.message, { status: relatedRowsError.code });
  }

  return {
    relationConfig,
    mainTableRowId,
    tableSettings,
    rowsRaw,
    relatedRowsRaw,
    rowsError,
  };
}

export function RelationsPage() {
  const {
    relationConfig,
    mainTableRowId,
    tableSettings,
    rowsRaw,
    relatedRowsRaw,
  } = useLoaderData<typeof loader>();
  const relationsName = relationConfig.joinTable;

  const relatedTable = useTable(relationConfig.relationTable);
  const [rows, setRows] = useState(
    DataRow.fromArray(relatedTable, tableSettings, rowsRaw)
  );
  const [rowsParams, setRowsParams] = useState(DefaultRowsParams);

  const initRelatedRows = DataRow.fromArray(
    relatedTable,
    tableSettings,
    relatedRowsRaw
  );
  const [selectedRows, setSelectedRows] = useState(initRelatedRows);

  const onRowsParamsChange = async (newParams: GetTableRowsParams) => {
    const res = await getTableRows(relatedTable.name, newParams);

    setRowsParams(newParams);
    setRows(DataRow.fromArray(relatedTable, tableSettings, res.rows));
  };

  const onRowAdd = (row: DataRow) => {
    const alreadySelected = selectedRows.some((sr) => sr.isEq(row));

    if (!alreadySelected) {
      setSelectedRows([...selectedRows, row]);
    }
  };

  const onRowRemove = (rowKey: string) => {
    setSelectedRows(selectedRows.filter((sr) => sr.getUniqueKey() != rowKey));
  };

  const onUpdate = async () => {
    const updatedIds = selectedRows.map((sr) => sr.getPKey());
    const initIds = initRelatedRows.map((rr) => rr.getPKey());

    const actions = {
      addIds: updatedIds.filter((id) => !initIds.includes(id)),
      deleteIds: initIds.filter((id) => !updatedIds.includes(id)),
    };

    const { error } = await updateRelatedRows(
      relationConfig,
      mainTableRowId,
      actions
    );

    if (error) {
      alert.error(error.message);
    } else {
      const res = await getRelatedRows(relationConfig, mainTableRowId);
      setSelectedRows(DataRow.fromArray(relatedTable, tableSettings, res.rows));

      alert.success("Updated");
    }
  };

  return (
    <>
      <title>{`${relationsName} - relations`}</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Relations {relationsName}
        </h1>

        <Button onClick={onUpdate}>Update</Button>
      </div>

      <h2 className="scroll-m-20 pb-2 text-xl font-normal tracking-tight first:mt-0">
        Linked Items:
      </h2>

      <div className="flex gap-3 my-4">
        {selectedRows.map((row) => {
          const rowKey = row.getUniqueKey();

          return (
            <Badge variant="outline" className="text-lg" key={rowKey}>
              <div
                className="mx-2 inline-flex items-center rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-100 cursor-pointer"
                aria-label="Remove item"
                onClick={() => onRowRemove(rowKey)}
              >
                <X size={18} aria-hidden="true" />
              </div>
              {row.getTextLabel()}
            </Badge>
          );
        })}
      </div>

      <div className="my-5 flex">
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

        <Pagination
          tableName={relatedTable.name}
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
        showSelects={false}
        sortValue={rowsParams.sort}
        onRowClick={onRowAdd}
        onSortChange={(newSortVal) => {
          onRowsParamsChange({
            ...rowsParams,
            sort: [newSortVal],
          });
        }}
      />
    </>
  );
}
