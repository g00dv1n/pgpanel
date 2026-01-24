import { fetchApiwithAuth } from "@/lib/auth";
import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";

interface GetTablesProps {
  reload?: boolean;
}

export async function getTables(props?: GetTablesProps) {
  const { reload = false } = props || {};

  const { data: tablesMap, error } = await fetchApiwithAuth<Record<string, PgTable>>(
    `/api/schema/tables?reload=${reload}`,
  );

  const tables = tablesMap ? Object.values(tablesMap) : [];

  return { tables, error };
}

export async function getTableSettings(tableName: string) {
  const { data: tableSettings, error } = await fetchApiwithAuth<TableSettings>(
    `/api/schema/table-settings/${tableName}`,
  );

  if (error) {
    return { error };
  }

  return { tableSettings };
}

export async function updateTableSettings(tableName: string, updateSettings: any) {
  const { data: tableSettings, error } = await fetchApiwithAuth<TableSettings>(
    `/api/schema/table-settings/${tableName}`,
    {
      method: "PUT",
      body: JSON.stringify(updateSettings),
    },
  );

  return { tableSettings, error };
}
