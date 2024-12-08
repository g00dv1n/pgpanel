// All Important PG related types

export enum PgTypeOID {
  BoolOID = 16,
  ByteaOID = 17,
  QCharOID = 18,
  NameOID = 19,
  Int8OID = 20,
  Int2OID = 21,
  Int4OID = 23,
  TextOID = 25,
  OIDOID = 26,
  TIDOID = 27,
  XIDOID = 28,
  CIDOID = 29,
  JSONOID = 114,
  XMLOID = 142,
  XMLArrayOID = 143,
  JSONArrayOID = 199,
  PointOID = 600,
  LsegOID = 601,
  PathOID = 602,
  BoxOID = 603,
  PolygonOID = 604,
  LineOID = 628,
  LineArrayOID = 629,
  CIDROID = 650,
  CIDRArrayOID = 651,
  Float4OID = 700,
  Float8OID = 701,
  CircleOID = 718,
  CircleArrayOID = 719,
  UnknownOID = 705,
  Macaddr8OID = 774,
  MacaddrOID = 829,
  InetOID = 869,
  BoolArrayOID = 1000,
  QCharArrayOID = 1002,
  NameArrayOID = 1003,
  Int2ArrayOID = 1005,
  Int4ArrayOID = 1007,
  TextArrayOID = 1009,
  TIDArrayOID = 1010,
  ByteaArrayOID = 1001,
  XIDArrayOID = 1011,
  CIDArrayOID = 1012,
  BPCharArrayOID = 1014,
  VarcharArrayOID = 1015,
  Int8ArrayOID = 1016,
  PointArrayOID = 1017,
  LsegArrayOID = 1018,
  PathArrayOID = 1019,
  BoxArrayOID = 1020,
  Float4ArrayOID = 1021,
  Float8ArrayOID = 1022,
  PolygonArrayOID = 1027,
  OIDArrayOID = 1028,
  ACLItemOID = 1033,
  ACLItemArrayOID = 1034,
  MacaddrArrayOID = 1040,
  InetArrayOID = 1041,
  BPCharOID = 1042,
  VarcharOID = 1043,
  DateOID = 1082,
  TimeOID = 1083,
  TimestampOID = 1114,
  TimestampArrayOID = 1115,
  DateArrayOID = 1182,
  TimeArrayOID = 1183,
  TimestamptzOID = 1184,
  TimestamptzArrayOID = 1185,
  IntervalOID = 1186,
  IntervalArrayOID = 1187,
  NumericArrayOID = 1231,
  TimetzOID = 1266,
  TimetzArrayOID = 1270,
  BitOID = 1560,
  BitArrayOID = 1561,
  VarbitOID = 1562,
  VarbitArrayOID = 1563,
  NumericOID = 1700,
  RecordOID = 2249,
  RecordArrayOID = 2287,
  UUIDOID = 2950,
  UUIDArrayOID = 2951,
  JSONBOID = 3802,
  JSONBArrayOID = 3807,
  DaterangeOID = 3912,
  DaterangeArrayOID = 3913,
  Int4rangeOID = 3904,
  Int4rangeArrayOID = 3905,
  NumrangeOID = 3906,
  NumrangeArrayOID = 3907,
  TsrangeOID = 3908,
  TsrangeArrayOID = 3909,
  TstzrangeOID = 3910,
  TstzrangeArrayOID = 3911,
  Int8rangeOID = 3926,
  Int8rangeArrayOID = 3927,
  JSONPathOID = 4072,
  JSONPathArrayOID = 4073,
  Int4multirangeOID = 4451,
  NummultirangeOID = 4532,
  TsmultirangeOID = 4533,
  TstzmultirangeOID = 4534,
  DatemultirangeOID = 4535,
  Int8multirangeOID = 4536,
  Int4multirangeArrayOID = 6150,
  NummultirangeArrayOID = 6151,
  TsmultirangeArrayOID = 6152,
  TstzmultirangeArrayOID = 6153,
  DatemultirangeArrayOID = 6155,
  Int8multirangeArrayOID = 6157,
}

export interface PgColumn {
  name: string;
  OID: PgTypeOID;
  regType: string;
  udtName: string;
  isNullable: boolean;
  default?: string | null;
}

export interface PgTable {
  name: string;
  schema: string;
  columns: PgColumn[];
  primaryKeys: string[];
}

export type RowField =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[]
  | Record<string, any> // JSON
  | Record<string, any>[]; // JSON ARRAY

export type Row = Record<string, RowField>;

export type RowPkeysMap = Record<string, string>;

export function fieldToString(value: RowField): string {
  if (value === null) {
    return "NULL"; // Represent null values
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value.toString(); // Convert primitive types to strings
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]"; // Empty array
    }

    // Check if it's an array of objects
    if (typeof value[0] === "object") {
      // Convert array of objects to stringified JSON with a newline between elements
      return JSON.stringify(value, null, 2);
    }

    // For arrays of primitives
    return value.map((v) => v.toString()).join(", ");
  }

  if (typeof value === "object") {
    try {
      // Convert objects (e.g., JSON) to a pretty-printed string
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Object]"; // Fallback for non-serializable objects
    }
  }

  return JSON.stringify("value");
}
