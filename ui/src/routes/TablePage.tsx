import { DbTablesMapContext } from "@/api/admin";
import { useContext } from "react";
import { useParams } from "react-router-dom";

export default function TablePage() {
  const { tableName = "" } = useParams();
  const tablesMap = useContext(DbTablesMapContext);
  const table = tablesMap[tableName];

  return (
    <>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {table.name}
      </h1>
    </>
  );
}
