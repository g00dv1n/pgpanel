import { PgTablesMapContext } from "@/api/data";
import { useContext } from "react";

export function useTablesMap() {
  return useContext(PgTablesMapContext);
}
