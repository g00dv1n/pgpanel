import { CustomInputProps } from "@/components/form/custom-inputs/common";
import {
  DateTimePicker,
  DateTimePickerProps,
} from "@/components/ui/datetime-picker";

interface DateTimeInputProps extends CustomInputProps {
  onlyDate?: boolean;
}

export function DateTimeInput({
  commonProps,
  onlyDate,
  changeValue,
}: DateTimeInputProps) {
  const value = commonProps.value ? new Date(commonProps.value) : undefined;

  const onChange = (newDate?: Date) => {
    if (newDate) {
      changeValue(newDate);
    }
  };

  const granularity = onlyDate ? "day" : "second";
  const displayFormat = onlyDate ? { hour12: "PPP" } : undefined;

  const dateTimeProps: DateTimePickerProps = {
    ...commonProps,
    value,
    granularity,
    displayFormat,
    onChange,
    hourCycle: 12,
  };

  return <DateTimePicker {...dateTimeProps} />;
}
