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
import { getForeignKeyColumnByTable } from "@/lib/pgTypes";
import { RelationsConfig } from "@/lib/tableSettings";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  data,
  LoaderFunctionArgs,
  NavLink,
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
  const { relationConfig, mainTableRowId, rowsRaw, relatedRowsRaw } =
    useLoaderData<typeof loader>();
  const relationsName = relationConfig.joinTable;

  const mainTable = useTable(relationConfig.mainTable);
  const relatedTable = useTable(relationConfig.relationTable);
  const joinTable = useTable(relationConfig.joinTable);

  const mainTableIdKey =
    getForeignKeyColumnByTable(joinTable, relationConfig.mainTable) || "id";

  const [mainTableRow, setMainTableRow] = useState<DataRow | undefined>();

  useEffect(() => {
    getMainTableRow(mainTable.name, mainTableIdKey, mainTableRowId).then(
      (res) => setMainTableRow(res.row && new DataRow(mainTable, res.row))
    );
  }, [mainTableIdKey, mainTableRowId, mainTable]);

  const [rows, setRows] = useState(DataRow.fromArray(relatedTable, rowsRaw));
  const [rowsParams, setRowsParams] = useState(DefaultRowsParams);

  const initRelatedRows = DataRow.fromArray(relatedTable, relatedRowsRaw);

  const [selectedRows, setSelectedRows] = useState(initRelatedRows);
  const selectedRowsKeys = selectedRows.map((r) => r.uniqueKey());

  const onRowSelect = (rowKey: string, selected: boolean) => {
    const row = rows.find((r) => r.uniqueKey() === rowKey);

    if (!(selected && row)) return;

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
    const updatedIds = selectedRows.map((sr) =>
      mainTableIdKey ? sr.get(mainTableIdKey) : sr.pKey()
    );
    const initIds = initRelatedRows.map((rr) =>
      mainTableIdKey ? rr.get(mainTableIdKey) : rr.pKey()
    );

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
      revalidator.revalidate();
      alert.success("Updated");
    }
  };

  return (
    <>
      <title>{`${relationsName} - relations`}</title>
      <div className="flex items-baseline">
        <h1 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
          Relations {relationsName} for
        </h1>
        {mainTableRow && (
          <Button className="text-2xl" variant="link" asChild>
            <NavLink to={mainTableRow.updateLink()}>
              {mainTableRow.textLabel()}
            </NavLink>
          </Button>
        )}

        <Button onClick={onUpdate}>Update</Button>
      </div>

      <h2 className="scroll-m-20 pb-2 text-xl font-normal tracking-tight first:mt-0">
        Linked Items:
      </h2>

      <div className="flex gap-3 my-4">
        {selectedRows.map((row) => {
          const rowKey = row.uniqueKey();

          return (
            <Badge variant="outline" className="text-lg" key={rowKey}>
              <div
                className="mx-2 inline-flex items-center rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-100 cursor-pointer"
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
      />
    </>
  );
}
