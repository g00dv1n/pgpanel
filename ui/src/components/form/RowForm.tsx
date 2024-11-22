import { updateTableRowByPrimaryKeys } from "@/api/data";
import { DynamicFormField } from "@/components/form/DynamicFormField";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PgTable, Row } from "@/lib/pgTypes";
import { useState } from "react";

interface RowFormProps {
  table: PgTable;
  row?: Row;
  onRowUpdate?: (updatedRow: Row) => void;
}

export function RowForm({ table, row, onRowUpdate }: RowFormProps) {
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

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        update();
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

      <Separator className="my-1" />
      <Button className="ml-auto" size="sm" type="submit" disabled={!canSave}>
        Save changes
      </Button>
    </form>
  );
}
