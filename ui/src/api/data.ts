import { Filters } from "@/lib/filters";
import { createContext } from "react";

export interface Column {
  name: string;
  dataType: string;
  isNullable: string;
  default: {
    String: string;
    Valid: boolean;
  };
}

export interface DBTable {
  name: string;
  columns: Column[];
  primaryKeys: string[];
}

export type RowField = string | number | string[] | null | boolean | object;
export type Row = Record<string, RowField>;

export type DBTablesMap = Record<string, DBTable>;
export const DBTablesMapContext = createContext({} as DBTablesMap);

export async function getTables() {
  const tablesMap: DBTablesMap = await fetch("/api/schema/tables").then((r) =>
    r.json()
  );

  return tablesMap;
}

export interface GetTableRowParams {
  offset: number;
  limit: number;
  sort?: string[];
  filters?: Filters;
}

const fieldsDelimiter = "|";

export function parseQueryRowParams(url: URL) {
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 50);

  const sortRaw = url.searchParams.get("sort") || undefined;
  const sort = sortRaw ? sortRaw.split(fieldsDelimiter) : undefined;

  const filtersStatement = url.searchParams.get("filters") || undefined;
  const filtersArgs = (url.searchParams.get("filtersArgs") || "").split(
    fieldsDelimiter
  );

  const filters = filtersStatement
    ? { statement: filtersStatement, args: filtersArgs }
    : undefined;

  return { offset, limit, sort, filters };
}

export function rowParamsToSearchParams({
  offset,
  limit,
  sort,
  filters,
}: GetTableRowParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("offset", offset.toString());
  searchParams.set("limit", limit.toString());
  if (sort) {
    searchParams.set("sort", sort.join(fieldsDelimiter));
  }
  if (filters) {
    searchParams.set("filters", filters.statement);
    searchParams.set("filtersArgs", filters.args.join(fieldsDelimiter));
  }

  return searchParams;
}

export async function getTableRows(
  tableName: string,
  rowParams: GetTableRowParams
) {
  const s = rowParamsToSearchParams(rowParams);
  const rows: Row[] = await fetch(`/api/data/${tableName}?${s}`).then((r) =>
    r.json()
  );

  return rows;
}
