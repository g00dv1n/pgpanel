import { exportStorage } from "@/api/backup";
import { alert } from "@/components/ui/global-alert";
import { LoadingButton } from "@/components/ui/loading-button";
import { downloadBlob } from "@/lib/utils";
import { useState } from "react";

export function ExportStorage() {
  const [exporting, setExporting] = useState(false);

  const exportFile = async () => {
    setExporting(true);
    const { fileBlob, error } = await exportStorage();
    setExporting(false);

    if (error) {
      alert.error(error.message);
      return;
    }

    const fileName = `storage.zip`;
    downloadBlob(fileBlob, fileName);
  };

  return (
    <>
      <LoadingButton loading={exporting} size="sm" onClick={exportFile}>
        Export
      </LoadingButton>
    </>
  );
}
