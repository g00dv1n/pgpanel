import { CommonInputProps } from "@/components/form/custom-inputs/common";
import { DateTimeInput } from "@/components/form/custom-inputs/DateTimeInput";
import { TimeInput } from "@/components/form/custom-inputs/TimeInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DefaultInputType } from "@/lib/typesMapping";
import { Plus, Trash } from "lucide-react";
import { useState } from "react";

export interface DynamicInputProps {
  name: string;
  type: DefaultInputType;
  isArray?: boolean;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  onChange?: (newVal: any) => void;
}

export function DynamicInputSingle({
  initialValue,
  name,
  required,
  placeholder,
  type,
  onChange = () => {},
}: DynamicInputProps) {
  const [value, setValue] = useState(normalizeVal(initialValue));

  const changeValue = (v: any) => {
    setValue(v);
    onChange(v);
  };

  const commonProps: CommonInputProps = {
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

    case "datepicker": {
      return (
        <DateTimeInput
          onlyDate={true}
          commonProps={commonProps}
          changeValue={changeValue}
        />
      );
    }
    case "datetimepicker": {
      return (
        <DateTimeInput commonProps={commonProps} changeValue={changeValue} />
      );
    }

    case "timepicker": {
      return <TimeInput commonProps={commonProps} changeValue={changeValue} />;
    }
  }

  return <div>Unsupported type</div>;
}

export function DynamicInputArray({
  initialValue,
  name,
  type,
  onChange = () => {},
}: DynamicInputProps) {
  const [arrayValues, setArrayValues] = useState<any[]>(
    initialValue ? initialValue : []
  );

  return (
    <div className="grid gap-3">
      {arrayValues.map((v, index) => {
        return (
          <div className="flex gap-1" key={index}>
            <DynamicInputSingle
              initialValue={v}
              name={name}
              type={type}
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

export function DynamicInput(props: DynamicInputProps) {
  if (props.isArray) {
    return <DynamicInputArray {...props} />;
  }

  return <DynamicInputSingle {...props} />;
}

function normalizeVal(val: any) {
  if (val === null) return undefined;

  return val;
}
