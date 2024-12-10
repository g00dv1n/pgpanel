import { insertTableRow, updateTableRowByPKeys } from "@/api/data";
import { DynamicInput } from "@/components/form/DynamicInput";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DataRow } from "@/lib/dataRow";
import { PgTable } from "@/lib/pgTypes";
import { useState } from "react";
import { resolveInputType } from "./InputsRegistry";

interface RowFormProps {
  table: PgTable;
  mode: "insert" | "update";
  row?: DataRow;
  onRowUpdate?: () => void;
}

export function RowForm({
  mode,
  table,
  row,
  onRowUpdate = () => {},
}: RowFormProps) {
  const [updatedRow, setUpdatedRow] = useState({});
  const canSave = Object.keys(updatedRow).length > 0;

  const update = async () => {
    if (!row) return;

    const { error } = await updateTableRowByPKeys(
      table.name,
      row.getPKeys(),
      updatedRow
    );

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success("Updated");
  };

  const insert = async () => {
    const { error } = await insertTableRow(table.name, updatedRow);

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success("Inserted");
  };

  const saveChanges = () => {
    if (mode === "insert") {
      insert();
    } else {
      update();
    }

    onRowUpdate();
  };

  return (
    <form className="grid gap-4" action={saveChanges}>
      {table.columns.map((column) => {
        const initialValue = row && row.get(column.name);
        const { type, isArray } = resolveInputType(column);

        const placeholder = column.default
          ? `DEFAULT: ${column.default}`
          : "NULL";

        const required = !(column.isNullable || column.default);

        return (
          <div className="grid gap-2" key={column.name}>
            <Label>
              {required && <span className="text-red-500">* </span>}
              {column.name}{" "}
              <code className="text-gray-700 px-2">({column.udtName})</code>
            </Label>
            <DynamicInput
              type={type}
              isArray={isArray}
              name={column.name}
              placeholder={placeholder}
              required={required}
              initialValue={initialValue}
              onChange={(val) => {
                setUpdatedRow({ ...updatedRow, [column.name]: val });
              }}
            />
          </div>
        );
      })}

      <Separator className="my-1" />
      <Button className="ml-auto" size="sm" type="submit" disabled={!canSave}>
        Save changes
      </Button>
    </form>
  );
}
