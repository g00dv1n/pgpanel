import { createContext } from "react";

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
export type ApiErr = { message: string };

export type DBTablesMap = Record<string, DBTable>;
export const DBTablesMapContext = createContext({} as DBTablesMap);

export async function fetchJsonData<T = any>(
  input: string | URL | globalThis.Request,
  init?: RequestInit
): Promise<{ data?: T; error?: ApiErr }> {
  const res = await fetch(input, init);
  const jsonRes = await res.json();

  let data: T | undefined = undefined;
  let error: ApiErr | undefined = undefined;

  if (res.ok) {
    data = jsonRes;
  } else {
    error = jsonRes;
  }

  return { data, error };
}

export async function getTables() {
  const { data: tablesMap, error } = await fetchJsonData<DBTablesMap>(
    "/api/schema/tables"
  );

  return { tablesMap, error };
}

export interface GetTableRowParams {
  offset: number;
  limit: number;
  sort?: string[];
  textFilters?: string;
  filters?: string;
  filtersArgs?: string;
}

const fieldsDelimiter = "|";

export function parseQueryRowParams(url: URL): GetTableRowParams {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);

  const sortRaw = url.searchParams.get("sort") || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const textFilters = url.searchParams.get("textFilters") || undefined;
  const filters = url.searchParams.get("filters") || undefined;
  const filtersArgs = url.searchParams.get("filtersArgs") || undefined;

  return { offset, limit, sort, textFilters, filters, filtersArgs };
}

export function rowParamsToSearchParams(params: GetTableRowParams) {
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
  rowParams: GetTableRowParams
) {
  const s = rowParamsToSearchParams(rowParams);
  const { data: rows = [], error } = await fetchJsonData<Row[]>(
    `/api/data/${tableName}?${s}`
  );

  return { rows, error };
}
