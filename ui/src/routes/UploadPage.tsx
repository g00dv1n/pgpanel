import {
  deleteFile,
  getFilesList,
  StorageFileInfo,
  uploadFile,
} from "@/api/files";
import { Controls } from "@/components/files/Controls";
import { FilesCatalog } from "@/components/files/FilesCatalog";
import { Search } from "@/components/files/Search";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useRevalidator,
} from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  return getFilesList({
    directory: url.searchParams.get("directory"),
    filter: url.searchParams.get("filter"),
  });
}

export function UploadPage() {
  const { list } = useLoaderData<typeof loader>();
  const [filterQ, setFilterQ] = useState("");
  const filtredList = list.filter((fi) => fileNameLike(fi.name, filterQ));

  const [selectedFiles, setSelectedFiles] = useState<StorageFileInfo[]>([]);

  const revalidator = useRevalidator();

  const upload = async (formData: FormData) => {
    const file = formData.get("file");

    if (!(file && file instanceof File && file.size > 0)) return;

    const { error } = await uploadFile(file);

    if (error) {
      alert.error(error.message);
    } else {
      alert.success("Uploaded");
      revalidator.revalidate();
    }
  };

  const deleteSelected = async () => {
    const deletePromises = selectedFiles.map((sf) => deleteFile(sf.name));

    await Promise.all(deletePromises);
    setSelectedFiles([]);
    revalidator.revalidate();
  };

  return (
    <>
      <title>upload | pgPanel</title>
      <div className="flex gap-5 items-center">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Upload files
        </h1>

        <Controls
          selectedCount={selectedFiles.length}
          onReset={() => setSelectedFiles([])}
          onDelete={() => deleteSelected()}
        />
      </div>

      <div className="max-w-80 my-5">
        <form className="flex gap-2" action={upload}>
          <Input type="file" name="file" />

          <Button type="submit">Upload</Button>
        </form>
      </div>
      <div className="w-1/2 my-5">
        <Search q={filterQ} onSearch={setFilterQ} />
      </div>

      <FilesCatalog
        list={filtredList}
        selected={selectedFiles}
        onSelect={(info, newSelected) => {
          if (newSelected) {
            setSelectedFiles([...selectedFiles, info]);
          } else {
            setSelectedFiles(
              selectedFiles.filter((sf) => sf.name !== info.name)
            );
          }
        }}
      />
    </>
  );
}

function fileNameLike(value: string, query: string): boolean {
  const regex = new RegExp(query, "i");
  return regex.test(value);
}
