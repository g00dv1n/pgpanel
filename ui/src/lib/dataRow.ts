import {
  fieldToString,
  PgTable,
  PgTypeOID,
  Row,
  RowPkeysMap,
} from "@/lib/pgTypes";
import { generateViewLink } from "@/lib/tableSettings";

// Wrapped Row that provides different helpers
// Should be used only in table context, can't be used for raw sql rows.
export class DataRow {
  #table: PgTable;
  #data: Row;

  constructor(table: PgTable, row: Row) {
    this.#table = table;
    this.#data = row;
  }

  static fromArray(table: PgTable, rows: Row[]) {
    return rows.map((r) => new DataRow(table, r));
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

  pKeys(): RowPkeysMap {
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

  // get first private key that can be used as ID
  // almost all tables have one private key
  // usually multiple private keys have join tables only
  pKey() {
    for (const col of this.#table.columns) {
      if (!col.isPrimaryKey) continue;

      const val = this.#data[col.name];

      return val;
    }

    return null;
  }

  pKeysFilters() {
    const pkeys = this.pKeys();

    const filters = Object.entries(pkeys)
      .map((e) => {
        const [pkey, val] = e;

        return `${pkey}=${val}`;
      })
      .join(" AND ");

    return { filters };
  }

  updateLink() {
    const s = new URLSearchParams(this.pKeysFilters());
    return `/${this.#table.name}/row/update?${s}`;
  }

  uniqueKey() {
    const pk = this.pKeys();
    const tableName = this.#table.name;
    return `${tableName}-${Object.values(pk).join("-")}`;
  }

  isEq(to: DataRow) {
    return this.uniqueKey() === to.uniqueKey();
  }

  textLabel() {
    const firstTextColumn = this.#table.columns.find((col) => {
      return col.OID === PgTypeOID.TextOID || col.OID === PgTypeOID.VarcharOID;
    });

    if (firstTextColumn) {
      const textValue = this.get(firstTextColumn.name);

      if (textValue) {
        return textValue.toString().substring(0, 50);
      }
    }

    // return ID as fallback
    const pk = this.pKeys();
    return Object.values(pk).join("-");
  }

  viewLink(viewLinkPattern: string | null | undefined) {
    if (!viewLinkPattern) return undefined;

    return generateViewLink(viewLinkPattern, this.#data);
  }

  toRow() {
    return { ...this.#data };
  }
}
