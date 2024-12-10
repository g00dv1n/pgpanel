import { Textarea } from "@/components/ui/textarea";
import { CustomInputProps } from "./common";

export function JsonTextarea({ commonProps, onChange }: CustomInputProps) {
  const value =
    typeof commonProps.value === "object"
      ? JSON.stringify(commonProps.value, null, 2)
      : commonProps.value;

  return (
    <Textarea
      {...commonProps}
      value={value}
      rows={10}
      onChange={(e) => {
        const newVal = e.target.value;
        onChange(newVal);
      }}
    />
  );
}
