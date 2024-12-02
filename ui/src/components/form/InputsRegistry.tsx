import { CommonInputProps } from "@/components/form/custom-inputs/common";
import { DateTimeInput } from "@/components/form/custom-inputs/DateTimeInput";
import { JsonTextarea } from "@/components/form/custom-inputs/JsonTextarea";
import { TimeInput } from "@/components/form/custom-inputs/TimeInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { PgColumn, PgTypeOID } from "@/lib/pgTypes";

// --------------- PG TYPE TO INPUT TYPE MAPPING ----------------------
export type InputType =
  | "checkbox"
  | "input"
  | "textarea"
  | "jsontextarea"
  | "datepicker"
  | "timepicker"
  | "datetimepicker";

export type InputTypeLookup = {
  type: InputType;
  isArray?: boolean;
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

export function resolveDefaultInputType(column: PgColumn): InputTypeLookup {
  if (MainPgTypesOidMap[column.OID]) {
    return MainPgTypesOidMap[column.OID];
  }

  return { type: "textarea" };
}

// --------------- Resolve input by type  ----------------------
export function resolveInputElementByType(
  type: InputType,
  commonProps: CommonInputProps,
  changeValue: (newVal: any) => void
): JSX.Element {
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

    case "jsontextarea": {
      return (
        <JsonTextarea commonProps={commonProps} changeValue={changeValue} />
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
