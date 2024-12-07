import { updateTableSettings } from "@/api/schema";
import {
  DynamicInput,
  DynamicInputProps,
} from "@/components/form/DynamicInput";
import { Button } from "@/components/ui/button";
import { alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";
import { useState } from "react";

export interface TableSettingsFormProps {
  table: PgTable;
  setttings: TableSettings;
}

export type SettingsFieldConfig = {
  name: keyof TableSettings;
  label: string;
} & Pick<DynamicInputProps, "type" | "isArray" | "placeholder">;

const settingsFields: SettingsFieldConfig[] = [
  {
    name: "viewLinkPattern",
    label: "View Link Pattern",
    type: "input",
  },
];

export function TableSettingsForm({
  table,
  setttings,
}: TableSettingsFormProps) {
  const [updateSettings, setUpdateSettings] = useState({});
  const canSave = Object.keys(updateSettings).length > 0;

  const saveChanges = async () => {
    const { error } = await updateTableSettings(table.name, updateSettings);

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success(`${table.name} settings updated`);
  };

  return (
    <form className="grid gap-4" action={saveChanges}>
      {settingsFields.map((field) => {
        return (
          <div className="grid gap-2" key={field.name}>
            <Label>{field.label}</Label>
            <DynamicInput
              {...field}
              initialValue={setttings[field.name]}
              onChange={(val) => {
                setUpdateSettings({ ...updateSettings, [field.name]: val });
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
