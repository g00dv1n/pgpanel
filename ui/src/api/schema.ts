import { fetchApiwithAuth } from "@/api/admin";
import { PgTable } from "@/lib/pgTypes";

interface GetTablesProps {
  reload?: boolean;
}

export async function getTables(props?: GetTablesProps) {
  const { reload = false } = props || {};

  const { data: tablesMap, error } = await fetchApiwithAuth<
    Record<string, PgTable>
  >(`/api/schema/tables?reload=${reload}`);

  const tables = tablesMap ? Object.values(tablesMap) : [];

  return { tables, error };
}

export interface TableSettings {
  viewLink: string;
}

export async function getTableSettings(tableName: string) {
  const { data: tableSettings, error } = await fetchApiwithAuth<TableSettings>(
    `/api/schema/${tableName}/settings`
  );

  return { tableSettings, error };
}
