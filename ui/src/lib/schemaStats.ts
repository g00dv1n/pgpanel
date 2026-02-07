export interface DatabaseSchemaStats {
  dbName: string;
  schemaName: string;
  tablesCount: number;
  totalRows: number;
  size: number;
  sizePretty: string;
}
