import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";

import {
  AutoInputTypes,
  InputType,
  ManualInputTypes,
  OverriddenInputsMap,
  resolveInputType,
} from "@/components/form/InputsRegistry";
import { Payload } from "@/components/form/table-settings/Payload";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FieldTypesSelectProps {
  table: PgTable;
  settings: TableSettings;
  onChange: (overrides: OverriddenInputsMap) => void;
}

export function FieldTypesSelect({
  table,
  settings,
  onChange: updateOvverides,
}: FieldTypesSelectProps) {
  const { overriddenInputs } = settings;

  return (
    <div className="grid grid-cols-2 gap-3 items-center my-3">
      {table.columns.map((col) => {
        const { type: autoType } = resolveInputType(col);
        const { type: selectedType, payload } = resolveInputType(
          col,
          overriddenInputs
        );

        return (
          <div className="grid gap-2" key={col.name}>
            <div>
              {col.name} - autodetected type{" "}
              <span className="font-medium">{autoType}</span>
            </div>
            <Select
              defaultValue={selectedType}
              onValueChange={(val) => {
                updateOvverides({
                  ...overriddenInputs,
                  [col.name]: {
                    type: val as InputType,
                  },
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an input type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Autodetected Types</SelectLabel>
                  {AutoInputTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Manul Setup Types</SelectLabel>
                  {ManualInputTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Payload
              type={selectedType}
              value={payload}
              onChange={(p) => {
                const newOverrides = { ...overriddenInputs };
                newOverrides[col.name].payload = p;

                updateOvverides(newOverrides);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
