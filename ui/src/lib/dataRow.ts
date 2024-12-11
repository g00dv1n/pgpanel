import { fieldToString, PgTable, Row, RowPkeysMap } from "@/lib/pgTypes";
import { generateViewLink, TableSettings } from "@/lib/tableSettings";

// Wrapped Row that provides different helpers
// Should be used only in table context, can't be used for raw sql rows.
export class DataRow {
  readonly #table: PgTable;
  readonly #tableSettings: TableSettings;
  #data: Row;

  constructor(table: PgTable, tableSettings: TableSettings, row: Row) {
    this.#table = table;
    this.#tableSettings = tableSettings;
    this.#data = row;
  }

  static fromArray(table: PgTable, tableSettings: TableSettings, rows: Row[]) {
    return rows.map((r) => new DataRow(table, tableSettings, r));
  }

  get(key: string) {
    return this.#data[key];
  }

  set(key: string, value: any) {
    this.#data[key] = value;
  }

  getAsString(key: string) {
    return fieldToString(this.#data[key]);
  }

  getPKeys(): RowPkeysMap {
    const map: RowPkeysMap = {};

    for (const col of this.#table.columns) {
      if (!col.isPrimaryKey) continue;

      const val = this.#data[col.name];

      if (val) {
        map[col.name] = val.toString();
      }
    }

    return map;
  }

  getUniqueKey() {
    const pk = this.getPKeys();
    const tableName = this.#table.name;
    return `${tableName}-${Object.values(pk).join("-")}`;
  }

  viewLink() {
    const { viewLinkPattern } = this.#tableSettings;

    if (!viewLinkPattern) return undefined;

    return generateViewLink(viewLinkPattern, this.#data);
  }

  toRow() {
    return { ...this.#data };
  }
}
