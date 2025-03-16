import { exportStorage } from "@/api/backup";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { downloadBlob } from "@/lib/utils";

export function ExportStorage() {
  const exportFile = async () => {
    const { fileBlob, error } = await exportStorage();

    if (error) {
      alert.error(error.message);
      return;
    }

    const fileName = `storage.zip`;
    downloadBlob(fileBlob, fileName);
  };

  return (
    <>
      <Button size="sm" onClick={exportFile}>
        Export
      </Button>
    </>
  );
}
