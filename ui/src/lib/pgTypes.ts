export const pgTypesMap = {
  // Numeric types
  smallint: "PgNumericType",
  integer: "PgNumericType",
  bigint: "PgNumericType",
  decimal: "PgNumericType",
  numeric: "PgNumericType",
  real: "PgNumericType",
  "double precision": "PgNumericType",
  money: "PgNumericType",

  // Serial types
  smallserial: "PgSerialType",
  serial: "PgSerialType",
  bigserial: "PgSerialType",

  // Character types
  char: "PgCharacterType",
  varchar: "PgCharacterType",
  "character varying": "PgCharacterType",

  // Text type
  text: "PgTextType",

  // Boolean type
  boolean: "PgBooleanType",

  // Date/time types
  date: "PgDateTimeType",
  timestamp: "PgDateTimeType",
  timestamptz: "PgDateTimeType",
  time: "PgDateTimeType",
  timetz: "PgDateTimeType",
  interval: "PgDateTimeType",

  // UUID type
  uuid: "PgUuidType",

  // JSON types
  json: "PgJsonType",
  jsonb: "PgJsonType",

  // Array type
  ARRAY: "PgArrayType",

  // Network types
  inet: "PgNetworkType",
  cidr: "PgNetworkType",
  macaddr: "PgNetworkType",

  // Geometric types
  point: "PgGeometricType",
  line: "PgGeometricType",
  lseg: "PgGeometricType",
  box: "PgGeometricType",
  path: "PgGeometricType",
  polygon: "PgGeometricType",
  circle: "PgGeometricType",

  // Enum type placeholder
  enum: "PgEnumType",

  // Bit string types
  bit: "PgBitStringType",
  "bit varying": "PgBitStringType",

  // Binary type
  bytea: "PgBinaryType",

  // XML type
  xml: "PgXmlType",
} as const;

export const PgUnknownType = "PgUnknownType";

export type PgType = keyof typeof pgTypesMap;
export type PgTypeCategory = (typeof pgTypesMap)[PgType];

export function getPgTypeCategory(pgType: string) {
  if (pgTypesMap[pgType as PgType]) {
    return pgTypesMap[pgType as PgType];
  }

  return PgUnknownType;
}
