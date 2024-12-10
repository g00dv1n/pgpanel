import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";

import {
  AutoInputTypes,
  ManualInputTypes,
  resolveInputType,
} from "@/components/form/InputsRegistry";
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
}

export function FieldTypesSelect({ table }: FieldTypesSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 items-center my-3">
      {table.columns.map((col) => {
        const { type: autoType } = resolveInputType(col);

        return (
          <div className="grid gap-2" key={col.name}>
            <div>
              {col.name} - autodetected type{" "}
              <span className="font-medium">{autoType}</span>
            </div>
            <Select defaultValue={autoType}>
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
          </div>
        );
      })}
    </div>
  );
}
