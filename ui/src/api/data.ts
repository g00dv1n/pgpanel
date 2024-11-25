import { fetchApiwithAuth } from "@/api/auth";
import { PgTable, PkeysMap, Row } from "@/lib/pgTypes";
import { createContext } from "react";

export type PgTablesMap = Record<string, PgTable>;
export const PgTablesMapContext = createContext({} as PgTablesMap);

export async function getTables() {
  const { data: tablesMap, error } = await fetchApiwithAuth<PgTablesMap>(
    "/api/schema/tables"
  );

  return { tablesMap, error };
}

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
  pkeysMap: PkeysMap,
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
  pkeys: PkeysMap[]
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

function pkeysMapToFilters(pkeysMap: PkeysMap) {
  if (Object.keys(pkeysMap).length === 0) {
    return "";
  }

  return Object.entries(pkeysMap)
    .map(([key, value]) => `${key}=${value}`)
    .join(" AND ");
}
