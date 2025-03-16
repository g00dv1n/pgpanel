import { exportDatabase } from "@/api/backup";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { alert } from "@/components/ui/global-alert";
import { downloadBlob } from "@/lib/utils";
import { useState } from "react";

export function ExportDB() {
  const [clean, setClean] = useState(true);
  const [dataOnly, setDataOnly] = useState(false);

  const exportFile = async () => {
    const { fileBlob, error } = await exportDatabase({
      clean,
      dataOnly,
    });

    if (error) {
      alert.error(error.message);
      return;
    }

    const fileName = `export_${Date.now()}.sql`;
    downloadBlob(fileBlob, fileName);
  };

  return (
    <>
      <div className="mb-4 text-lg">
        Export via <code className="text-gray-700">pg_dump</code>
      </div>
      <div className="flex items-center space-x-2 my-2">
        <Checkbox
          checked={clean}
          onCheckedChange={(c) => {
            if (c === true) {
              setClean(true);
              setDataOnly(false);
            } else {
              setClean(false);
            }
          }}
        />
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Clean (overwrite objects during import)
        </label>
      </div>
      <div className="flex items-center space-x-2 my-2">
        <Checkbox
          disabled={clean}
          checked={dataOnly}
          onCheckedChange={(c) => setDataOnly(c === true)}
        />
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Data only
        </label>
      </div>
      <Button size="sm" className="my-2" onClick={exportFile}>
        Export
      </Button>
    </>
  );
}
