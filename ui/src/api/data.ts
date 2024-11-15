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
  filters?: string;
  filtersArgs?: string;
}

const fieldsDelimiter = "|";

export function parseQueryRowParams(url: URL) {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);

  const sortRaw = url.searchParams.get("sort") || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const filters = url.searchParams.get("filters") || undefined;
  const filtersArgs = url.searchParams.get("filtersArgs") || undefined;

  return { offset, limit, sort, filters, filtersArgs };
}

export function rowParamsToSearchParams({
  offset,
  limit,
  sort,
  filters,
  filtersArgs,
}: GetTableRowParams) {
  const searchParams = new URLSearchParams();

  searchParams.set("offset", offset.toString());
  searchParams.set("limit", limit.toString());

  if (sort) {
    searchParams.set("sort", sort.join(fieldsDelimiter));
  }
  if (filters) {
    searchParams.set("filters", filters);
  }

  if (filtersArgs) {
    searchParams.set("filtersArgs", filtersArgs);
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
