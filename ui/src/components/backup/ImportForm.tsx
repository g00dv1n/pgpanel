import { importDatabase } from "@/api/backup";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Input } from "@/components/ui/input";

export function ImportForm() {
  const importFile = async (formData: FormData) => {
    const file = formData.get("file");

    if (!(file && file instanceof File && file.size > 0)) return;

    const { error } = await importDatabase(file);

    if (error) {
      alert.error(error.message);
    } else {
      alert.success("Imported");
    }
  };

  return (
    <>
      <div className="mb-4 text-lg">
        Import via <code className="text-gray-700">psql</code>
      </div>
      <form className="flex items-center space-x-2 my-2" action={importFile}>
        <Input className="max-w-60" type="file" name="file" />
        <Button size="sm" type="submit">
          Import
        </Button>
      </form>
    </>
  );
}
