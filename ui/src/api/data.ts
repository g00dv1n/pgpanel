import { createAuthFetchClient } from "@/api/fetchClient";
import { createContext } from "react";

const client = createAuthFetchClient("");

export interface Column {
  name: string;
  dataType: string;
  dataTypeCategory: string;
  isNullable: string;
  default: {
    String: string;
    Valid: boolean;
  };
}

export interface DBTable {
  name: string;
  columns: Column[];
  primaryKeys: string[];
}

export type RowField = string | number | string[] | null | boolean | object;
export type Row = Record<string, RowField>;

export type DBTablesMap = Record<string, DBTable>;
export const DBTablesMapContext = createContext({} as DBTablesMap);

export async function getTables() {
  const { data: tablesMap, error } = await client.get<DBTablesMap>(
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
  const { data: rows = [], error } = await client.get<Row[]>(
    `/api/data/${tableName}?${s}`
  );

  return { rows, error };
}
