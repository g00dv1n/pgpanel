import { DBTable } from "@/api/data";
import { getPgTypeCategory } from "@/lib/pgTypes";

export interface Filters {
  statement: string;
  args: any[];
}

export function searchByTextColumnsFilters(q: string, table: DBTable): Filters {
  const cols = table.columns.filter((col) => {
    const typeCat = getPgTypeCategory(col.dataType);

    return typeCat === "PgTextType" || typeCat === "PgCharacterType";
  });

  if (cols.length === 0) {
    return { statement: "", args: [] };
  }

  const statement = cols.map((c) => `${c.name} ILIKE $1`).join(" OR ");
  const args = [`%${q.toLowerCase()}%`];

  return {
    statement,
    args,
  };
}
