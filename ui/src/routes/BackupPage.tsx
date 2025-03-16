import { ExportDB } from "@/components/backup/ExportDB";
import { ExportStorage } from "@/components/backup/ExportStorage";
import { ImportDB } from "@/components/backup/ImportDB";
import { Separator } from "@/components/ui/separator";

export function BackupPage() {
  return (
    <>
      <title>Backup | pgPanel</title>
      <h2 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
        Import/Export Database
      </h2>

      <div className="my-4">
        <ExportDB />
      </div>
      <Separator />

      <div className="my-4">
        <ImportDB />
      </div>
      <h2 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0 mt-5">
        Export Storage
      </h2>
      <div className="my-2">
        <ExportStorage />
      </div>
    </>
  );
}
