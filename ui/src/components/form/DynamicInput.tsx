import { CommonInputProps } from "@/components/form/custom-inputs/common";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { useState } from "react";
import { InputType, resolveInputElementByType } from "./InputsRegistry";

export interface DynamicInputProps {
  name: string;
  type: InputType;
  isArray?: boolean;
  initialValue?: any;
  required?: boolean;
  placeholder?: string;
  payload?: any;
  onChange?: (newVal: any) => void;
}

export function DynamicInputSingle({
  initialValue,
  name,
  required,
  placeholder,
  type,
  payload = {},
  onChange = () => {},
}: DynamicInputProps) {
  const [value, setValue] = useState(normalizeEmpty(initialValue));

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

  return resolveInputElementByType(type, payload, commonProps, changeValue);
}

export function DynamicInputArray({
  initialValue,
  name,
  type,
  onChange = () => {},
}: DynamicInputProps) {
  const [arrayValues, setArrayValues] = useState<any[]>(initialValue ? initialValue : []);

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

function normalizeEmpty(val: any | null | undefined): any {
  if (val === null) return "";
  if (val === undefined) return "";

  return val;
}
