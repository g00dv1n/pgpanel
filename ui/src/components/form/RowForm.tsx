import { DynamicFormField } from "@/components/form/DynamicFormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PgTable, Row } from "@/lib/pgTypes";
import { useState } from "react";

interface RowFormProps {
  table: PgTable;
  row?: Row;
}

export function RowForm({ table, row: rowInit }: RowFormProps) {
  const [row, setRow] = useState(rowInit || {});

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();

        console.log(row);
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
                setRow({ ...row, [col.name]: val });
              }}
            />
          </div>
        );
      })}

      <Button className="ml-auto" size="lg" type="submit">
        Save changes
      </Button>
    </form>
  );
}
