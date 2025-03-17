import { paramsToURLSearchParams } from "@/api/data";
import {
  deleteFile,
  FilesListParams,
  getFilesList,
  parseQueryFileListParams,
  StorageFileInfo,
  uploadFile,
} from "@/api/files";
import { Controls } from "@/components/files/Controls";
import { Explorer } from "@/components/files/Explorer";
import { Search } from "@/components/files/Search";
import { Pagination } from "@/components/table/Pagination";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const listParams = parseQueryFileListParams(url);
  const { list, error } = await getFilesList(listParams);

  return { list, error, listParams };
}

export function UploadPage() {
  const { list, listParams } = useLoaderData<typeof loader>();
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

  const navigate = useNavigate();

  const onListParamsChange = (newParams: FilesListParams) => {
    const s = paramsToURLSearchParams(newParams);
    navigate(`?${s}`);
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

          <Button className=" bg-blue-500 hover:bg-blue-600" type="submit">
            Upload
          </Button>
        </form>
      </div>

      <div className="flex my-5">
        <div className="w-1/2">
          <Search
            q={listParams.search}
            onSearch={(q) => {
              onListParamsChange({ ...listParams, offset: 0, search: q });
            }}
          />
        </div>

        <Pagination
          tableName=""
          offset={listParams.offset}
          limit={listParams.limit}
          onChange={(offset, limit) => {
            onListParamsChange({
              ...listParams,
              offset,
              limit,
            });
          }}
        />
      </div>

      <Explorer
        list={list}
        selected={selectedFiles}
        onSelect={(info, selected) => {
          if (selected) {
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
