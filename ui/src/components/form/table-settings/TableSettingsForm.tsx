import { updateTableSettings } from "@/api/schema";
import {
  DynamicInput,
  DynamicInputProps,
} from "@/components/form/DynamicInput";
import { FieldTypesSelect } from "@/components/form/table-settings/FieldTypesSelect";
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
  onSettingsUpdate?: () => void;
}

type SettingsField = keyof TableSettings;

export type SettingsFieldConfig = {
  name: SettingsField;
  label: string;
} & Pick<DynamicInputProps, "type" | "isArray" | "placeholder">;

const settingsFields: Record<string, SettingsFieldConfig> = {
  viewLinkPattern: {
    name: "viewLinkPattern",
    label: "View Link Pattern",
    type: "input",
  },
} as const;

export function TableSettingsForm({
  table,
  setttings: initSettngs,
  onSettingsUpdate = () => {},
}: TableSettingsFormProps) {
  const [setttings, setSettings] = useState(initSettngs);

  const saveChanges = async () => {
    const { error } = await updateTableSettings(table.name, setttings);

    if (error) {
      alert.error(error.message);
      return;
    }

    alert.success(`${table.name} settings updated`);
    onSettingsUpdate();
  };

  const renderDynamicInput = (field: SettingsField) => {
    const config = settingsFields[field];

    return (
      <div className="grid gap-2">
        <Label>{config.label}</Label>
        <DynamicInput
          {...config}
          initialValue={setttings[field]}
          onChange={(val) => {
            setSettings({ ...setttings, [field]: val });
          }}
        />
      </div>
    );
  };

  return (
    <form className="grid gap-4" action={saveChanges}>
      {renderDynamicInput("viewLinkPattern")}
      <FieldTypesSelect
        table={table}
        settings={setttings}
        onChange={(o) => {
          setSettings({
            ...setttings,
            overriddenInputs: o,
          });
        }}
      />
      <Separator className="my-1" />
      <Button className="ml-auto" size="sm" type="submit">
        Save changes
      </Button>
    </form>
  );
}
