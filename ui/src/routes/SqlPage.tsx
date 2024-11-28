import { executeSQL, SQLExecutionResponse } from "@/api/sql";
import { SqlTable } from "@/components/table/SqlTable";
import { LoadingButton } from "@/components/ui/loading-button";
import { useTablesMap } from "@/hooks/use-tables";
import { PgTable } from "@/lib/pgTypes";
import { PostgreSQL, sql, SQLNamespace } from "@codemirror/lang-sql";
import { githubLight } from "@uiw/codemirror-theme-github";
import ReactCodeMirror from "@uiw/react-codemirror";
import { Play } from "lucide-react";
import { useState } from "react";

export function SqlPage() {
  const tablesMap = useTablesMap();
  const tables = Object.values(tablesMap);

  const [sqlQuery, setSqlQuery] = useState("");

  const [sqlError, setSqlError] = useState("");
  const [sqlResponse, setSqlResponse] = useState<
    SQLExecutionResponse | undefined
  >(undefined);

  const [isExecuting, setIsExecuting] = useState(false);

  const showTable =
    sqlResponse && sqlResponse.columns.length > 0 && !isExecuting;

  const showRowsAffected = sqlResponse && !isExecuting;

  const run = async () => {
    setIsExecuting(true);
    const res = await executeSQL(sqlQuery);

    if (res.error) {
      setSqlError(res.error.message);
      setSqlResponse(undefined);
    } else {
      setSqlError("");
      setSqlResponse(res.sqlResponse);
    }
    setIsExecuting(false);
  };

  return (
    <>
      <title>SQL Editor | pgPanel</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          SQL Editor
        </h1>
        <LoadingButton
          loading={isExecuting}
          size="icon"
          variant="outline"
          onClick={() => run()}
        >
          <Play />
        </LoadingButton>

        {showRowsAffected && (
          <div>
            Rows affected:{" "}
            <span className="text-green-600">{sqlResponse.rowsAffected}</span>
          </div>
        )}
      </div>

      <div className="w-full my-5 border">
        <ReactCodeMirror
          height="200px"
          onChange={setSqlQuery}
          indentWithTab={false}
          inputMode="search"
          basicSetup={{
            searchKeymap: false,
          }}
          theme={githubLight}
          extensions={[
            sql({
              dialect: PostgreSQL,
              schema: buildAutocompleteSqlSchema(tables),
              upperCaseKeywords: true,
            }),
          ]}
        />
      </div>

      {showTable && (
        <SqlTable columns={sqlResponse.columns} rows={sqlResponse.rows} />
      )}

      {sqlError && (
        <div className="my-5 text-red-600 max-w-[750px]">{sqlError}</div>
      )}
    </>
  );
}

function buildAutocompleteSqlSchema(tables: PgTable[]): SQLNamespace {
  const schema: SQLNamespace = {};

  for (const table of tables) {
    const columns = table.columns.map((c) => c.name);
    schema[table.name] = columns;
  }

  return schema;
}
