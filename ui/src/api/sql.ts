import { fetchApiwithAuth } from "@/api/admin";
import { Row } from "@/lib/pgTypes";

export interface SQLExecutionResponse {
  columns: string[];
  rows: Row[];
  rowsAffected: number;
}

export async function executeSQL(query: string, args?: any[]) {
  const body = { query, args };

  const { data: sqlResponse, error } =
    await fetchApiwithAuth<SQLExecutionResponse>("/api/sql/execute", {
      method: "POST",
      body: JSON.stringify(body),
    });

  return { sqlResponse, error };
}
