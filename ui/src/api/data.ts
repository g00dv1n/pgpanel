import { createContext } from "react";

export interface Column {
  name: string;
  dataType: string;
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
  const tablesMap: DBTablesMap = await fetch("/api/schema/tables").then((r) =>
    r.json()
  );

  return tablesMap;
}

export interface GetTableRowParams {
  offset: number;
  limit: number;
  sort?: string;
}

export function parseQueryRowParams(url: URL) {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);
  const sort = url.searchParams.get("sort") || undefined;

  return { offset, limit, sort };
}

export async function getTableRows(
  tableName: string,
  { offset, limit, sort }: GetTableRowParams
) {
  const searchParams = new URLSearchParams();
  searchParams.set("offset", offset.toString());
  searchParams.set("limit", limit.toString());
  if (sort) {
    searchParams.set("sort", sort);
  }

  const rows: Row[] = await fetch(
    `/api/data/${tableName}?${searchParams.toString()}`
  ).then((r) => r.json());

  return rows;
}
