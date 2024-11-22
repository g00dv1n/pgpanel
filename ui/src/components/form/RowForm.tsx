import { updateTableRowByPrimaryKeys } from "@/api/data";
import { DynamicFormField } from "@/components/form/DynamicFormField";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { PgTable, Row } from "@/lib/pgTypes";
import { useState } from "react";

interface RowFormProps {
  table: PgTable;
  row?: Row;
}

export function RowForm({ table, row }: RowFormProps) {
  const [updatedRow, setUpdatedRow] = useState({});
  const canSave = Object.keys(updatedRow).length > 0;

  const saveChanges = async () => {
    const pkeysMap = table.primaryKeys.reduce((result, key) => {
      return { ...result, [key]: row && row[key] };
    }, {});

    const { error } = await updateTableRowByPrimaryKeys(
      table.name,
      pkeysMap,
      updatedRow
    );

    if (error) {
      alert.error(error.message);
    } else {
      alert.success("Updated");
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();

        console.log(row);
        saveChanges();
      }}
    >
      {table.columns.map((col) => {
        const value = row && row[col.name];
        return (
          <div className="grid gap-2" key={col.name}>
            <Label>{`${col.name} - ${col.udtName}`}</Label>
            <DynamicFormField
              column={col}
              initialValue={value}
              onChange={(val) => {
                setUpdatedRow({ ...row, [col.name]: val });
              }}
            />
          </div>
        );
      })}

      <Button className="ml-auto" size="lg" type="submit" disabled={!canSave}>
        Save changes
      </Button>
    </form>
  );
}
