import { insertTableRow, updateTableRowByPrimaryKeys } from "@/api/data";
import { DynamicFormField } from "@/components/form/DynamicFormField";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PgTable, Row } from "@/lib/pgTypes";
import { useState } from "react";

interface RowFormProps {
  table: PgTable;
  mode: "insert" | "update";
  row?: Row;
  onRowUpdate?: (updatedRow: Row) => void;
}

export function RowForm({ mode, table, row, onRowUpdate }: RowFormProps) {
  const [updatedRow, setUpdatedRow] = useState({});
  const canSave = Object.keys(updatedRow).length > 0;

  const update = async () => {
    const pkeysMap = table.primaryKeys.reduce((result, key) => {
      return { ...result, [key]: row && row[key] };
    }, {});

    const { rows, error } = await updateTableRowByPrimaryKeys(
      table.name,
      pkeysMap,
      updatedRow
    );

    if (error) {
      alert.error(error.message);
      return;
    }

    if (onRowUpdate) {
      onRowUpdate(rows[0]);
    }

    alert.success("Updated");
  };

  const insert = async () => {
    const { rows, error } = await insertTableRow(table.name, updatedRow);

    if (error) {
      alert.error(error.message);
      return;
    }

    if (onRowUpdate) {
      onRowUpdate(rows[0]);
    }

    alert.success("Inserted");
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();

        if (mode === "insert") {
          insert();
        } else {
          update();
        }
      }}
    >
      {table.columns.map((col) => {
        const value = row && row[col.name];
        return (
          <div className="grid gap-2" key={col.name}>
            <Label>
              {col.name}{" "}
              <code className="text-gray-700 px-2">({col.udtName})</code>
            </Label>
            <DynamicFormField
              column={col}
              initialValue={value}
              onChange={(val) => {
                setUpdatedRow({ ...updatedRow, [col.name]: val });
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
