import { FormViewMode, insertTableRow, updateTableRowByPKeys } from "@/api/data";
import { DynamicInput } from "@/components/form/DynamicInput";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { useTables } from "@/hooks/use-tables";
import { DataRow } from "@/lib/dataRow";
import { PgTable } from "@/lib/pgTypes";
import { generateEditRelationsLink, TableSettings } from "@/lib/tableSettings";
import { Link2 } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";
import { resolveInputType } from "./InputsRegistry";

export interface RowFormProps {
  table: PgTable;
  tableSettings: TableSettings;
  mode: FormViewMode;
  row?: DataRow;
  onRowUpdate?: (row: DataRow) => void;
  onCancel?: () => void;
}

export function RowForm({
  mode,
  table,
  tableSettings,
  row,
  onRowUpdate = () => {},
  onCancel = () => {},
}: RowFormProps) {
  const [updatedRow, setUpdatedRow] = useState({});
  const canSave = Object.keys(updatedRow).length > 0;

  const update = async () => {
    if (!row) return;

    const { error, rows } = await updateTableRowByPKeys(table.name, row.pKeys(), updatedRow);

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success("Updated");
    const [updatedRowFromResp] = rows;

    onRowUpdate(new DataRow(table, updatedRowFromResp));
  };

  const insert = async () => {
    const { error, rows } = await insertTableRow(table.name, updatedRow);

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success("Inserted");
    const [insertedRowFromResp] = rows;

    onRowUpdate(new DataRow(table, insertedRowFromResp));
  };

  const saveChanges = async () => {
    if (mode === "insert") {
      await insert();
    } else {
      await update();
    }
  };

  const relations = tableSettings.relations || [];
  const allTables = useTables();

  const getTable = (tableName: string) => {
    const res = allTables.find((t) => t.name === tableName);

    if (!res) throw Error(`Can't getTable = ${tableName}`);

    return res;
  };

  // Use a regular div instead of a form to prevent weird bugs.
  // We don't need submit action and autocomplete features
  return (
    <div className="grid gap-4">
      {table.columns.map((column) => {
        const initialValue = row && row.get(column.name);
        const { type, isArray, payload } = resolveInputType(column, tableSettings.overriddenInputs);
        const notHidden = type !== "hidden";

        const placeholder = column.default ? `DEFAULT: ${column.default}` : "NULL";

        const required = !(column.isNullable || column.default);

        return (
          <div className="grid gap-2" key={column.name}>
            {notHidden && (
              <Label>
                {required && <span className="text-red-500">* </span>}
                {column.name} <code className="text-gray-700 px-2">({column.udtName})</code>
              </Label>
            )}
            <DynamicInput
              type={type}
              isArray={isArray}
              payload={payload}
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

      <div className="flex flex-col items-start">
        {row &&
          relations.map((conf) => {
            const link = generateEditRelationsLink(row, conf, getTable(conf.joinTable));

            return (
              <Button key={link} className="p-0" variant="link" asChild>
                <NavLink to={link}>
                  Edit {conf.joinTable} relations <Link2 />
                </NavLink>
              </Button>
            );
          })}
      </div>

      <div className="flex gap-3 mt-1">
        <Button size="sm" type="button" disabled={!canSave} onClick={saveChanges}>
          Save changes
        </Button>

        <Button size="sm" variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
