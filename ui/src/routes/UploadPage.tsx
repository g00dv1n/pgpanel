import { uploadFile } from "@/api/files";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Input } from "@/components/ui/input";

export function UploadPage() {
  const upload = async (formData: FormData) => {
    const file = formData.get("file");

    if (!(file && file instanceof File && file.size > 0)) return;

    const { error } = await uploadFile(file);

    if (error) {
      alert.error(error.message);
    } else {
      alert.success("Uploaded");
    }
  };

  return (
    <>
      <h1>Upload files</h1>

      <div className="max-w-80">
        <form className="flex gap-2" action={upload}>
          <Input type="file" name="file" />

          <Button type="submit">Upload</Button>
        </form>
      </div>
    </>
  );
}
