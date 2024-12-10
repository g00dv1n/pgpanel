import { PgTable } from "@/lib/pgTypes";
import { TableSettings } from "@/lib/tableSettings";

import {
  AutoInputTypes,
  resolveDefaultInputType,
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
    <div>
      {table.columns.map((col) => {
        const { type: defaultType } = resolveDefaultInputType(col);

        return (
          <div className="grid grid-cols-2 items-center my-3" key={col.name}>
            <div>{col.name}</div>
            <Select defaultValue={defaultType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an input type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Types</SelectLabel>
                  {AutoInputTypes.map((type) => (
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
