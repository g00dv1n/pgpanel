import { CommonInputProps } from "@/components/form/custom-inputs/common";
import { DateTimeInput } from "@/components/form/custom-inputs/DateTimeInput";
import { JsonTextarea } from "@/components/form/custom-inputs/JsonTextarea";
import { SelectInput } from "@/components/form/custom-inputs/SelectInput";
import { TimeInput } from "@/components/form/custom-inputs/TimeInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { PgColumn, PgTypeOID } from "@/lib/pgTypes";

// --------------- PG TYPE TO INPUT TYPE MAPPING ----------------------

export const AutoInputTypes = [
  "checkbox",
  "input",
  "textarea",
  "jsontextarea",
  "datepicker",
  "timepicker",
  "datetimepicker",
] as const;

export const ManualInputTypes = ["select"] as const;

export type InputType =
  | (typeof AutoInputTypes)[number]
  | (typeof ManualInputTypes)[number];

export type InputTypeLookup = {
  type: InputType;
  isArray?: boolean;
  payload?: any;
};

export const MainPgTypesOidMap: Record<number, InputTypeLookup> = {
  // Boolean
  [PgTypeOID.BoolOID]: { type: "checkbox" },

  // Numeric
  [PgTypeOID.Int2OID]: { type: "input" },
  [PgTypeOID.Int4OID]: { type: "input" },
  [PgTypeOID.Int8OID]: { type: "input" },
  [PgTypeOID.Float4OID]: { type: "input" },
  [PgTypeOID.Float8OID]: { type: "input" },
  [PgTypeOID.NumericOID]: { type: "input" },

  // Textual
  [PgTypeOID.TextOID]: { type: "textarea" },
  [PgTypeOID.VarcharOID]: { type: "textarea" },
  [PgTypeOID.BPCharOID]: { type: "textarea" },
  [PgTypeOID.NameOID]: { type: "textarea" },

  // Dates and Times
  [PgTypeOID.DateOID]: { type: "datepicker" },
  [PgTypeOID.TimestampOID]: { type: "datetimepicker" },
  [PgTypeOID.TimestamptzOID]: { type: "datetimepicker" },
  [PgTypeOID.TimeOID]: { type: "timepicker" },
  [PgTypeOID.TimetzOID]: { type: "datetimepicker" },
  [PgTypeOID.IntervalOID]: { type: "textarea" },

  // JSON
  [PgTypeOID.JSONOID]: { type: "jsontextarea" },
  [PgTypeOID.JSONBOID]: { type: "jsontextarea" },
  [PgTypeOID.JSONPathOID]: { type: "jsontextarea" },

  // Arrays
  [PgTypeOID.TextArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.VarcharArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int2ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int4ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Int8ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Float4ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.Float8ArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.DateArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.TimestampArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.TimestamptzArrayOID]: { type: "datepicker", isArray: true },
  [PgTypeOID.JSONBArrayOID]: { type: "textarea", isArray: true },
  [PgTypeOID.InetArrayOID]: { type: "input", isArray: true },
  [PgTypeOID.UUIDArrayOID]: { type: "input", isArray: true },
};

export type OverriddenInputsMap = Record<string, InputTypeLookup>;

export function resolveInputType(
  column: PgColumn,
  overriddenMap?: OverriddenInputsMap | null
): InputTypeLookup {
  const autodetectedType: InputTypeLookup | undefined =
    MainPgTypesOidMap[column.OID];
  const overriddenType: InputTypeLookup | undefined = overriddenMap
    ? overriddenMap[column.name]
    : undefined;

  return overriddenType || autodetectedType || { type: "textarea" };
}

// --------------- Resolve input by type  ----------------------
export function resolveInputElementByType(
  type: InputType,
  payload: any,
  commonProps: CommonInputProps,
  onChange: (newVal: any) => void
) {
  switch (type) {
    case "checkbox": {
      return (
        <Checkbox
          {...commonProps}
          checked={commonProps.value}
          onCheckedChange={(checked) => {
            onChange(checked);
          }}
        />
      );
    }

    case "input": {
      return (
        <Input
          {...commonProps}
          onChange={(e) => {
            onChange(e.target.value);
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
            onChange(e.target.value);
          }}
        />
      );
    }

    case "jsontextarea": {
      return <JsonTextarea commonProps={commonProps} onChange={onChange} />;
    }

    case "datepicker": {
      return (
        <DateTimeInput
          onlyDate={true}
          commonProps={commonProps}
          onChange={onChange}
        />
      );
    }
    case "datetimepicker": {
      return <DateTimeInput commonProps={commonProps} onChange={onChange} />;
    }

    case "timepicker": {
      return <TimeInput commonProps={commonProps} onChange={onChange} />;
    }
    case "select": {
      return (
        <SelectInput
          commonProps={commonProps}
          onChange={onChange}
          payload={payload}
        />
      );
    }
  }

  return <div>Unsupported type</div>;
}
