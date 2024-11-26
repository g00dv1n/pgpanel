import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getColumnDefaultInputType, PgColumn } from "@/lib/pgTypes";
import { Plus, Trash } from "lucide-react";
import { useState } from "react";

interface DynamicFormFieldProps {
  column: PgColumn;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  onChange?: (newVal: any) => void;
}

export function DynamicFormFieldSingle({
  initialValue,
  column,
  required,
  placeholder,
  onChange,
}: DynamicFormFieldProps) {
  const { type } = getColumnDefaultInputType(column);
  const { name } = column;

  const [value, setValue] = useState(initialValue);

  const changeValue = (v: any) => {
    setValue(v);
    if (onChange) {
      onChange(v);
    }
  };

  const commonProps = {
    name,
    value,
    placeholder,
    required,
  };

  switch (type) {
    case "checkbox": {
      return (
        <Checkbox
          {...commonProps}
          checked={commonProps.value}
          onCheckedChange={(checked) => {
            changeValue(checked);
          }}
        />
      );
    }

    case "input": {
      return (
        <Input
          {...commonProps}
          onChange={(e) => {
            changeValue(e.target.value);
          }}
        />
      );
    }

    case "textarea": {
      return (
        <Textarea
          {...commonProps}
          rows={3}
          onChange={(e) => {
            changeValue(e.target.value);
          }}
        />
      );
    }

    case "datetimepicker": {
      const dateTimeValue = commonProps.value
        ? new Date(commonProps.value)
        : undefined;

      return (
        <DateTimePicker
          {...commonProps}
          value={dateTimeValue}
          onChange={(newDate) => {
            if (newDate) {
              changeValue(newDate);
            }
          }}
        />
      );
    }
  }

  return <div>Unsupported type</div>;
}

export function DynamicFormFieldArray({
  initialValue,
  column,
  onChange = () => {},
}: DynamicFormFieldProps) {
  const [arrayValues, setArrayValues] = useState<any[]>(
    initialValue ? initialValue : []
  );

  return (
    <div className="grid gap-3">
      {arrayValues.map((v, index) => {
        return (
          <div className="flex gap-1" key={index}>
            <DynamicFormFieldSingle
              initialValue={v}
              column={column}
              onChange={(elementValue) => {
                const newValues = [...arrayValues];
                newValues[index] = elementValue;

                setArrayValues(newValues);
                onChange(newValues);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => {
                const newValues = arrayValues.filter((_, i) => i !== index);

                setArrayValues(newValues);
                onChange(newValues);
              }}
            >
              <Trash />
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        className="ml-auto"
        size="icon"
        onClick={() => {
          setArrayValues([...arrayValues, ""]);
        }}
      >
        <Plus />
      </Button>
    </div>
  );
}

export function DynamicFormField(props: DynamicFormFieldProps) {
  const { isArray } = getColumnDefaultInputType(props.column);

  if (isArray) {
    return <DynamicFormFieldArray {...props} />;
  }

  return <DynamicFormFieldSingle {...props} />;
}
