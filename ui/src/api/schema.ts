import { fetchApiwithAuth } from "@/api/admin";
import { PgTable } from "@/lib/pgTypes";

export type PgTablesMap = Record<string, PgTable>;

export async function getTables() {
  const { data: tablesMap, error } = await fetchApiwithAuth<PgTablesMap>(
    "/api/schema/tables"
  );

  return { tablesMap, error };
}
