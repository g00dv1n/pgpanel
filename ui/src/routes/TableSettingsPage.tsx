import { getTableSettings } from "@/api/schema";
import { TableSettingsForm } from "@/components/form/table-settings/TableSettingsForm";
import { Button } from "@/components/ui/button";
import { useTable } from "@/hooks/use-tables";
import { ChevronLeft } from "lucide-react";

import { data, LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  const tableName = params.tableName || "";

  const { tableSettings, error: settingsError } = await getTableSettings(tableName);

  if (settingsError) {
    throw data(settingsError.message, { status: settingsError.code });
  }

  return { tableName, tableSettings };
}

export function TableSettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { tableName, tableSettings } = loaderData;

  const table = useTable(tableName);

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <>
      <title>{`${tableName} - settings `}</title>
      <div className="flex gap-3 items-baseline mb-4">
        <Button variant="outline" size="icon" onClick={goBack}>
          <ChevronLeft />
        </Button>
        <h1 className="scroll-m-20 pb-2 text-2xl font-semibold">{tableName} settings</h1>
      </div>
      <TableSettingsForm
        key={table.name}
        table={table}
        setttings={tableSettings}
        onCancel={goBack}
      />
    </>
  );
}
