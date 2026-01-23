import { PgTable } from "@/lib/pgTypes";
import { createContext, useContext } from "react";

export const TablesContext = createContext([] as PgTable[]);

export function useTables() {
  return useContext(TablesContext);
}

export function useTable(name: string) {
  const tables = useTables();

  const table = tables.find((t) => t.name === name);

  if (!table) {
    throw Error("Unknown table");
  }

  return table;
}
