import { CustomInputProps } from "@/components/form/custom-inputs/common";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectPayload {
  options?: string[];
  multi?: boolean;
}

export function SelectInput({ commonProps, payload, onChange }: CustomInputProps<SelectPayload>) {
  const { options = [], multi = false } = payload || {};

  // Single select
  if (!multi) {
    return (
      <Select {...commonProps} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={commonProps.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((v) => {
              return (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  return (
    <MultipleSelector
      value={toMultiSelectOptions(commonProps.value)}
      placeholder={commonProps.placeholder}
      onChange={(val) => {
        onChange(fromMultiSelectOptions(val));
      }}
      defaultOptions={toMultiSelectOptions(options)}
      hidePlaceholderWhenSelected={true}
      hideClearAllButton={true}
    />
  );
}

function toMultiSelectOptions(options: string[] | null | undefined) {
  if (!options) return [];

  return options.map((value) => {
    return { value, label: value };
  });
}

function fromMultiSelectOptions(options: Option[]) {
  return options.map((o) => o.value);
}
