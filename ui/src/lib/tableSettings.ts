import { OverriddenInputsMap } from "@/components/form/InputsRegistry";
import { DataRow } from "@/lib/dataRow";
import { PgTable, Row } from "@/lib/pgTypes";

export interface TableSettings {
  viewLinkPattern: string | null;
  overriddenInputs: OverriddenInputsMap | null;
  relations?: RelationsConfig[];
}

export interface RelationsConfig {
  mainTable: string;
  relationTable: string;
  joinTable: string;
  bidirectional?: boolean;
}

// pattern format: 'https://admin.example.com/users/{user_id}/{role_id}'
// user_id is a column name
export function generateViewLink(pattern: string, _row: Row | DataRow) {
  const row = _row instanceof DataRow ? _row.toRow() : _row;

  let link = pattern;

  for (const [column, value] of Object.entries(row)) {
    if (!value) continue;

    const urlValue = encodeURIComponent(value.toString());

    link = link.replaceAll(`{${column}}`, urlValue);
  }

  return link;
}

export function generateEditRelationsLink(
  row: Row | DataRow,
  conf: RelationsConfig,
  joinTable: PgTable
) {
  const mainTableIdKey = getForeignKeyColumnByTable(joinTable, conf.mainTable);
  if (!mainTableIdKey) {
    throw Error(
      "Can't get mainTableIdKey. Incorrect RelationsConfig or joinTable"
    );
  }

  const mainTableRowId =
    row instanceof DataRow ? row.get(mainTableIdKey) : row[mainTableIdKey];

  if (!mainTableRowId) {
    throw Error(
      "Can't get mainTableRowId. Incorrect RelationsConfig or joinTable"
    );
  }

  const s = new URLSearchParams({
    relationTable: conf.relationTable,
    joinTable: conf.joinTable,
    bidirectional: conf.bidirectional ? "true" : "false",
    mainTableIdKey,
    mainTableRowId: mainTableRowId.toString(),
  });

  return `/${conf.mainTable}/relations?${s}`;
}

function getForeignKeyColumnByTable(
  joinTable: PgTable,
  foreignTableName: string
) {
  const fkCol = joinTable.columns.find(
    (col) => col.foreignKey && col.foreignKey.tableName === foreignTableName
  );

  if (!(fkCol && fkCol.foreignKey)) return undefined;

  return fkCol.foreignKey.columnName;
}

export function getHiddenColumns(
  inputsMap: OverriddenInputsMap | null | undefined
) {
  const hiddenNames: string[] = [];

  for (const [colName, lookup] of Object.entries(inputsMap || {})) {
    if (lookup.type === "hidden") {
      hiddenNames.push(colName);
    }
  }

  return hiddenNames;
}
