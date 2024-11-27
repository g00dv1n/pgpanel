import { executeSQL, SQLExecutionResponse } from "@/api/sql";
import { Button } from "@/components/ui/button";
import { useTablesMap } from "@/hooks/use-tables";
import { PgTable } from "@/lib/pgTypes";
import { sql, SQLNamespace } from "@codemirror/lang-sql";
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

  const { rowsAffected = 0 } = sqlResponse || {};

  const run = async () => {
    const res = await executeSQL(sqlQuery);

    if (res.error) {
      setSqlError(res.error.message);
      setSqlResponse(undefined);
    } else {
      setSqlError("");
      setSqlResponse(res.sqlResponse);
    }
  };

  return (
    <>
      <title>SQL Editor | pgPanel</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          SQL Editor
        </h1>
        <Button size="icon" variant="outline" onClick={() => run()}>
          <Play />
        </Button>
      </div>

      <div className="w-full my-5">
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
              schema: buildAutocompleteSqlSchema(tables),
              upperCaseKeywords: true,
            }),
          ]}
        />
      </div>

      <div className="rounded-md border mt-5">
        <span>Rows affected: {rowsAffected}</span>
      </div>

      {sqlError && (
        <div className="my-5 text-red-600 max-w-[750px]">{sqlError}</div>
      )}
    </>
  );
}

function buildAutocompleteSqlSchema(tables: PgTable[]): SQLNamespace {
  const schema: SQLNamespace = {};

  for (const table of tables) {
    schema[table.name] = table.columns.map((c) => c.name);
  }

  return schema;
}
