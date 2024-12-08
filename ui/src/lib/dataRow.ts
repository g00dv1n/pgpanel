import {
  fieldToString,
  getPKeys,
  getRowKey,
  PgTable,
  Row,
} from "@/lib/pgTypes";
import { generateViewLink, TableSettings } from "@/lib/tableSettings";

// Wrapped Row that provides different helpers easy to use
export class DataRow {
  readonly #table: PgTable;
  readonly #tableSettings: TableSettings;
  #data: Row;

  constructor(table: PgTable, tableSettings: TableSettings, row: Row) {
    this.#table = table;
    this.#tableSettings = tableSettings;
    this.#data = row;
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

  getKey() {
    return getRowKey(this.#table, this.#data);
  }

  getPKeys() {
    return getPKeys(this.#table, this.#data);
  }

  viewLink() {
    const { viewLinkPattern } = this.#tableSettings;

    if (!viewLinkPattern) return undefined;

    return generateViewLink(viewLinkPattern, this.#data);
  }

  toRow() {
    return { ...this.#data };
  }

  static fromArray(table: PgTable, tableSettings: TableSettings, rows: Row[]) {
    return rows.map((r) => new DataRow(table, tableSettings, r));
  }
}
