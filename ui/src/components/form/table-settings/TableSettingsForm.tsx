import { updateTableSettings } from "@/api/schema";
import { DynamicInput, DynamicInputProps } from "@/components/form/DynamicInput";
import { ColumnsSelect } from "@/components/form/table-settings/ColumnsSelect";
import { FieldTypesSelect } from "@/components/form/table-settings/FieldTypesSelect";
import { RelationsSelect } from "@/components/form/table-settings/RelationsSelect";
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
  onCancel?: () => void;
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
  onCancel = () => {},
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
    <div className="grid gap-4">
      {renderDynamicInput("viewLinkPattern")}

      <div className="grid gap-2">
        <Label>Columns to show at table view</Label>
        <ColumnsSelect
          columns={table.columns}
          selected={setttings.tableViewSelectColumns}
          onChange={(tableViewSelectColumns) => {
            setSettings({
              ...setttings,
              tableViewSelectColumns,
            });
          }}
        />
      </div>

      <div className="grid gap-2">
        <Label>
          Columns to use for text search (if zero selected, all text columns will be used)
        </Label>
        <ColumnsSelect
          columns={table.columns}
          selected={setttings.tableViewTextFiltersCols}
          onChange={(tableViewTextFiltersCols) => {
            setSettings({
              ...setttings,
              tableViewTextFiltersCols,
            });
          }}
        />
      </div>

      <div className="grid gap-2">
        <Label>Relations</Label>
        <RelationsSelect
          relations={setttings.relations}
          mainTable={table.name}
          onChange={(relations) => {
            setSettings({
              ...setttings,
              relations,
            });
          }}
        />
      </div>

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

      <div className="flex gap-3 mt-1">
        <Button size="sm" type="button" onClick={saveChanges}>
          Save changes
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
