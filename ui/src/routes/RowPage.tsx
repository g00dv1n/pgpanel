import { getTableRow, parseQueryRowsParams } from "@/api/data";
import { getTableSettings } from "@/api/schema";
import { RowForm, RowMode } from "@/components/form/RowForm";
import { Button } from "@/components/ui/button";
import { useTable } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";
import { ChevronLeft, ExternalLink } from "lucide-react";
import {
  data,
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";
  const mode: RowMode = params.mode === "update" ? "update" : "insert";

  const { tableSettings, error: settingsError } = await getTableSettings(
    tableName
  );

  if (settingsError) {
    throw data(settingsError.message, { status: settingsError.code });
  }

  if (mode === "insert") {
    return { tableName, mode, tableSettings };
  }

  const rowsParams = parseQueryRowsParams(new URL(request.url));
  const { row: rawRow, error: rowError } = await getTableRow(
    tableName,
    rowsParams
  );

  return { tableName, mode, tableSettings, rowsParams, rawRow, rowError };
}

export function RowPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { tableName, mode, tableSettings, rawRow } = loaderData;

  const table = useTable(tableName);

  const row = rawRow ? new DataRow(table, tableSettings, rawRow) : undefined;
  const viewLink = row?.viewLink();
  // key needed to trigger form re-render
  const formKey = row?.getUniqueKey() || `insert-to-${tableName}`;

  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const onRowUpdate = (row: DataRow) => {
    if (mode === "insert") {
      return navigate(row.updateLink(), { replace: true });
    }

    revalidator.revalidate();
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <div className="flex gap-3 items-baseline">
        <Button variant="outline" size="icon" onClick={goBack}>
          <ChevronLeft />
        </Button>
        <h1 className="scroll-m-20 pb-2 text-2xl font-semibold mb-4">
          {mode} {table.name} row
        </h1>
        {viewLink && (
          <Button className="text-blue-600" variant="link" asChild>
            <a href={viewLink} target="_blank">
              {viewLink} <ExternalLink />
            </a>
          </Button>
        )}
      </div>

      <RowForm
        key={formKey}
        onRowUpdate={onRowUpdate}
        onCancel={goBack}
        row={row}
        mode={mode}
        table={table}
        tableSettings={tableSettings}
      />
    </div>
  );
}
