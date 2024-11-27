import { PgTablesMap } from "@/api/schema";
import { createContext, useContext } from "react";

export const PgTablesMapContext = createContext({} as PgTablesMap);

export function useTablesMap() {
  return useContext(PgTablesMapContext);
}
