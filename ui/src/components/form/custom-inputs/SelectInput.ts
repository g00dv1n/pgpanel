import { CustomInputProps } from "@/components/form/custom-inputs/common";

export interface SelectPayload {
  options?: string[];
  multi?: boolean;
}

export function SelectInput({
  commonProps,
  payload,
  onChange: changeValue,
}: CustomInputProps<SelectPayload>) {
  console.log(commonProps, payload, changeValue);
}
