import { PgTable } from "@/lib/pgTypes";
import { createContext, useContext } from "react";

export const TablesContext = createContext([] as PgTable[]);

export function useTables() {
  return useContext(TablesContext);
}
