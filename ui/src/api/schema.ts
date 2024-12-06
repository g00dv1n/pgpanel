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

export interface TableSettings {
  table: PgTable;
  config: any;
}

export async function getTableSettings(tableName: string) {
  const { data: tableSettings, error } = await fetchApiwithAuth<TableSettings>(
    `/api/schema/${tableName}/settings`
  );

  return { tableSettings, error };
}
