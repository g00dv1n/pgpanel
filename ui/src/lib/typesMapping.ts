import { PgColumn, PgTypeOID } from "@/lib/pgTypes";

export type DefaultInputType =
  | "checkbox"
  | "input"
  | "textarea"
  | "datepicker"
  | "timepicker"
  | "datetimepicker";

export type DefaultInputTypeLookup = {
  type: DefaultInputType;
  isArray?: boolean;
  isJson?: boolean;
};

export const MainPgTypesOidMap: Record<number, DefaultInputTypeLookup> = {
  // Boolean
  [PgTypeOID.BoolOID]: { type: "checkbox" },

  // Numeric
  [PgTypeOID.Int2OID]: { type: "input" },
  [PgTypeOID.Int4OID]: { type: "input" },
  [PgTypeOID.Int8OID]: { type: "input" },
  [PgTypeOID.Float4OID]: { type: "input" },
  [PgTypeOID.Float8OID]: { type: "input" },
  [PgTypeOID.NumericOID]: { type: "input" },

  // Textual
  [PgTypeOID.TextOID]: { type: "textarea" },
  [PgTypeOID.VarcharOID]: { type: "textarea" },
  [PgTypeOID.BPCharOID]: { type: "textarea" },
  [PgTypeOID.NameOID]: { type: "textarea" },

  // Dates and Times
  [PgTypeOID.DateOID]: { type: "datepicker" },
  [PgTypeOID.TimestampOID]: { type: "datetimepicker" },
  [PgTypeOID.TimestamptzOID]: { type: "datetimepicker" },
  [PgTypeOID.TimeOID]: { type: "timepicker" },
  [PgTypeOID.TimetzOID]: { type: "datetimepicker" },
  [PgTypeOID.IntervalOID]: { type: "textarea" },

  // JSON
  [PgTypeOID.JSONOID]: { type: "textarea", isJson: true },
  [PgTypeOID.JSONBOID]: { type: "textarea", isJson: true },
  [PgTypeOID.JSONPathOID]: { type: "textarea", isJson: true },

  // Arrays
  [PgTypeOID.TextArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.VarcharArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int2ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int4ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int8ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Float4ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Float8ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.DateArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.TimestampArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.TimestamptzArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.JSONBArrayOID]: { type: "textarea", isArray: true },
  [PgTypeOID.InetArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.UUIDArrayOID]: { type: "input", isArray: true },
};

export function getColumnDefaultInputType(
  column: PgColumn
): DefaultInputTypeLookup {
  if (MainPgTypesOidMap[column.OID]) {
    return MainPgTypesOidMap[column.OID];
  }

  return { type: "textarea" };
}
