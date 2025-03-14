import { ExportForm } from "@/components/backup/ExportForm";
import { ImportForm } from "@/components/backup/ImportForm";
import { Separator } from "@/components/ui/separator";

export function BackupPage() {
  return (
    <>
      <title>Backup | pgPanel</title>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Import/Export Database
      </h1>

      <div className="my-4">
        <ExportForm />
      </div>
      <Separator />

      <div className="my-4">
        <ImportForm />
      </div>
    </>
  );
}
