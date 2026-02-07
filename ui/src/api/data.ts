import { fetchApiwithAuth } from "@/lib/auth";
import { Row, RowPkeysMap } from "@/lib/pgTypes";
import { RelationsConfig, TableSettings } from "@/lib/tableSettings";

export interface GetTableRowsParams {
  offset: number;
  limit: number;
  sort?: string[];
  selectCols?: string[];
  textFilters?: string;
  textFiltersCols?: string[];
  filters?: string;
  filtersArgs?: string;
}

export type GetTableRowsParamsFrontend = Omit<GetTableRowsParams, "selectCols" | "textFiltersCols">;

const fieldsDelimiter = "|";

export function parseQueryRowsParams(url: URL): GetTableRowsParamsFrontend {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);

  const sortRaw = url.searchParams.get("sort") || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const textFilters = url.searchParams.get("textFilters") || undefined;

  const filters = url.searchParams.get("filters") || undefined;
  const filtersArgs = url.searchParams.get("filtersArgs") || undefined;

  return { offset, limit, sort, textFilters, filters, filtersArgs };
}

export function paramsToURLSearchParams(params: Record<string, any>) {
  const searchParams = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (val) {
      const valEncoded = Array.isArray(val) ? val.join(fieldsDelimiter) : val;
      searchParams.set(key, valEncoded);
    }
  }
  return searchParams;
}

export function buildGetTableRowsParamsWithSettings(
  rowsParams: GetTableRowsParamsFrontend,
  settings: TableSettings,
): GetTableRowsParams {
  return {
    ...rowsParams,
    selectCols: settings.tableViewSelectColumns,
    textFiltersCols: rowsParams.textFilters ? settings.tableViewTextFiltersCols : undefined,
  };
}

export async function getTableRow(
  tableName: string,
  rowParams: Pick<GetTableRowsParams, "textFilters" | "filters" | "filtersArgs">,
) {
  const { textFilters, filters, filtersArgs } = rowParams;

  const s = paramsToURLSearchParams({
    textFilters,
    filters,
    filtersArgs,
    offset: 0,
    limit: 1,
  });
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(`/api/data/${tableName}?${s}`);

  return { row: rows.at(0), error };
}

export async function getTableRows(tableName: string, rowParams: GetTableRowsParams) {
  const s = paramsToURLSearchParams(rowParams);
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(`/api/data/${tableName}?${s}`);

  return { rows, error };
}

export async function updateTableRowByPKeys(
  tableName: string,
  pkeysMap: RowPkeysMap,
  updateFileds: any,
) {
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?filters=${pkeysMapToFilters(pkeysMap)}`,
    {
      method: "PUT",
      body: JSON.stringify(updateFileds),
    },
  );

  return { rows, error };
}

export async function deleteTableRowsByPkeys(tableName: string, pkeys: RowPkeysMap[]) {
  const filters = pkeys.map(pkeysMapToFilters).join(" OR ");

  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?filters=${filters}`,
    {
      method: "DELETE",
    },
  );

  return { rows, error };
}

export async function insertTableRow(tableName: string, row: any) {
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(`/api/data/${tableName}`, {
    method: "POST",
    body: JSON.stringify(row),
  });

  return { rows, error };
}

export async function getRelatedRows(relation: RelationsConfig, mainTableRowId: any) {
  const { relationTable, joinTable } = relation;
  const s = new URLSearchParams({ relationTable, joinTable });

  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${relation.mainTable}/relations/${mainTableRowId}?${s}`,
  );

  return { rows, error };
}

export async function updateRelatedRows(
  relation: RelationsConfig,
  mainTableRowId: any,
  actions: { addIds: any[]; deleteIds: any[] },
) {
  const { relationTable, joinTable, bidirectional } = relation;
  const s = new URLSearchParams({
    relationTable,
    joinTable,
    bidirectional: bidirectional ? "true" : "false",
  });

  const { data: status, error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${relation.mainTable}/relations/${mainTableRowId}?${s}`,
    {
      method: "PUT",
      body: JSON.stringify(actions),
    },
  );

  return { status, error };
}

function pkeysMapToFilters(pkeysMap: RowPkeysMap) {
  if (Object.keys(pkeysMap).length === 0) {
    return "";
  }

  return Object.entries(pkeysMap)
    .map(([key, value]) => `${key}=${value}`)
    .join(" AND ");
}
