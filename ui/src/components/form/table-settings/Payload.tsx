import { InputType } from "@/components/form/InputsRegistry";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PayloadProps {
  type: InputType;
  value?: any;
  onChange: (value: any) => void;
}

export interface SelectPayload {
  options?: string[];
  multi?: boolean;
}

export function Payload({
  type,
  value = {},
  onChange: updatePayload,
}: PayloadProps) {
  switch (type) {
    case "select": {
      const { options = [], multi = false } = value as SelectPayload;

      return (
        <div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="(comma separated options): optionA,optionB,optionC,..."
              defaultValue={options.join(",")}
              onChange={(e) => {
                const newOptions = e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter((v) => v.length > 0);

                updatePayload({
                  multi,
                  options: newOptions,
                });
              }}
            />
            <Label>Multiselect</Label>
            <Checkbox
              defaultChecked={multi}
              onCheckedChange={(v) => {
                updatePayload({
                  options,
                  multi: v,
                });
              }}
            />
          </div>
        </div>
      );
    }
  }

  return null;
}
