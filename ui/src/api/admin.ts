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

interface GetTableRowParams {
  tableName: string;
  offset: number;
  limit: number;
}

export async function getTableRows({
  tableName,
  offset,
  limit,
}: GetTableRowParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("offset", offset.toString());
  searchParams.set("limit", limit.toString());

  const rows: Row[] = await fetch(
    `/api/data/${tableName}?${searchParams.toString()}`
  ).then((r) => r.json());

  return rows;
}
