import { fetchApiwithAuth } from "@/api/admin";
import { Row, RowPkeysMap } from "@/lib/pgTypes";

export interface GetTableRowsParams {
  offset: number;
  limit: number;
  sort?: string[];
  textFilters?: string;
  filters?: string;
  filtersArgs?: string;
}

const fieldsDelimiter = "|";

export function parseQueryRowsParams(url: URL): GetTableRowsParams {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);

  const sortRaw = url.searchParams.get("sort") || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const textFilters = url.searchParams.get("textFilters") || undefined;
  const filters = url.searchParams.get("filters") || undefined;
  const filtersArgs = url.searchParams.get("filtersArgs") || undefined;

  return { offset, limit, sort, textFilters, filters, filtersArgs };
}

export function rowsParamsToSearchParams(params: GetTableRowsParams) {
  const searchParams = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (val) {
      searchParams.set(key, val);
    }
  }
  return searchParams;
}

export async function getTableRow(
  tableName: string,
  rowParams: Pick<GetTableRowsParams, "textFilters" | "filters" | "filtersArgs">
) {
  const { textFilters, filters, filtersArgs } = rowParams;

  const s = rowsParamsToSearchParams({
    textFilters,
    filters,
    filtersArgs,
    offset: 0,
    limit: 1,
  });
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?${s}`
  );

  return { row: rows.at(0), error };
}

export async function getTableRows(
  tableName: string,
  rowParams: GetTableRowsParams
) {
  const s = rowsParamsToSearchParams(rowParams);
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?${s}`
  );

  return { rows, error };
}

export async function updateTableRowByPKeys(
  tableName: string,
  pkeysMap: RowPkeysMap,
  updateFileds: any
) {
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?filters=${pkeysMapToFilters(pkeysMap)}`,
    {
      method: "PUT",
      body: JSON.stringify(updateFileds),
    }
  );

  return { rows, error };
}

export async function deleteTableRowsByPkeys(
  tableName: string,
  pkeys: RowPkeysMap[]
) {
  const filters = pkeys.map(pkeysMapToFilters).join(" OR ");

  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}?filters=${filters}`,
    {
      method: "DELETE",
    }
  );

  return { rows, error };
}

export async function insertTableRow(tableName: string, row: any) {
  const { data: rows = [], error } = await fetchApiwithAuth<Row[]>(
    `/api/data/${tableName}`,
    {
      method: "POST",
      body: JSON.stringify(row),
    }
  );

  return { rows, error };
}

function pkeysMapToFilters(pkeysMap: RowPkeysMap) {
  if (Object.keys(pkeysMap).length === 0) {
    return "";
  }

  return Object.entries(pkeysMap)
    .map(([key, value]) => `${key}=${value}`)
    .join(" AND ");
}
