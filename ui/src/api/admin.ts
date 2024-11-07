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

export interface Table {
  name: string;
  columns: Column[];
  primaryKeys: string[];
}

export type DbTablesMap = Record<string, Table>;
export const DbTablesMapContext = createContext({} as DbTablesMap);

export async function getTables() {
  const tablesMap: DbTablesMap = await fetch("/api/schema/tables").then((r) =>
    r.json()
  );

  return tablesMap;
}
