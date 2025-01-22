import { getFilesList, uploadFile } from "@/api/files";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
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

  return (
    <>
      <title>upload | pgPanel</title>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Upload files
      </h1>

      <div className="max-w-80 my-5">
        <form className="flex gap-2" action={upload}>
          <Input type="file" name="file" />

          <Button type="submit">Upload</Button>
        </form>
      </div>

      <div className="flex gap-4 flex-wrap my-10">
        {list.map((info) => {
          return (
            <div className="flex flex-col gap-1 items-center">
              <img className="size-52 object-contain" src={info.internalUrl} />
              <div className="w-full flex items-center gap-2">
                <div>{info.name}</div>
                <Button className="ml-auto" size="icon" variant="destructive">
                  <Trash />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
