import { fetchApiwithAuth } from "@/lib/auth";
import { PgColumn, Row, RowPkeysMap } from "@/lib/pgTypes";
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

type GetTableRowsParamsQK = keyof GetTableRowsParams;

const fieldsDelimiter = "|";

export function parseQueryRowsParams(url: URL): GetTableRowsParams {
  const offset = Number(url.searchParams.get("offset" satisfies GetTableRowsParamsQK) || 0);
  const limit = Number(url.searchParams.get("limit" satisfies GetTableRowsParamsQK) || 50);

  const sortRaw = url.searchParams.get("sort" satisfies GetTableRowsParamsQK) || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const textFilters =
    url.searchParams.get("textFilters" satisfies GetTableRowsParamsQK) || undefined;

  const filters = url.searchParams.get("filters" satisfies GetTableRowsParamsQK) || undefined;
  const filtersArgs =
    url.searchParams.get("filtersArgs" satisfies GetTableRowsParamsQK) || undefined;

  // Skip parsing of selectCols and textFiltersCols
  // They wont be used in UI query params
  // They will be applied from table settings in getTableView

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

export interface TableView {
  rows: Row[];
  columns: PgColumn[];
}

export async function getTableView(tableName: string, rowParams: GetTableRowsParams) {
  const s = paramsToURLSearchParams(rowParams);
  const { data, error } = await fetchApiwithAuth<TableView>(
    `/api/data/${tableName}/table-view?${s}`,
  );

  return { rows: data?.rows || [], columns: data?.columns || [], error };
}

export interface FormView {
  rows?: [Row];
  tableSettings: TableSettings;
}

export type FormViewMode = "insert" | "update";

// pkeysFilters is just regular filters, but with primary keys
export async function getFormView(tableName: string, mode: FormViewMode, pkeysFilters?: string) {
  const s = new URLSearchParams();
  s.set("mode", mode);

  if (pkeysFilters) {
    s.set("filters", pkeysFilters);
  }

  const { data, error } = await fetchApiwithAuth<FormView>(`/api/data/${tableName}/form-view?${s}`);

  if (error) return { error };

  const { rows, tableSettings } = data;

  if (mode === "insert") {
    return { tableSettings };
  }

  return { row: rows![0], tableSettings };
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
