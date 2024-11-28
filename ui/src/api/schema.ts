import { fetchApiwithAuth } from "@/api/admin";
import { PgTable } from "@/lib/pgTypes";

export type PgTablesMap = Record<string, PgTable>;

interface GetTablesProps {
  reload?: boolean;
}

export async function getTables(props?: GetTablesProps) {
  const { reload = false } = props || {};

  const { data: tablesMap, error } = await fetchApiwithAuth<PgTablesMap>(
    `/api/schema/tables?reload=${reload}`
  );

  return { tablesMap, error };
}
