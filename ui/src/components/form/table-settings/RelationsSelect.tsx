import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTables } from "@/hooks/use-tables";
import { RelationsConfig } from "@/lib/tableSettings";
import { Trash } from "lucide-react";

interface RelationsSelectProps {
  mainTable: string;
  relations?: RelationsConfig[];
  onChange: (relations: RelationsConfig[]) => void;
}

export function RelationsSelect({ mainTable, relations = [], onChange }: RelationsSelectProps) {
  const [relationTable, setRelationTable] = useState("");
  const [joinTable, setJoinTable] = useState("");
  const [bidirectional, setBidirectional] = useState(false);

  const tables = useTables();

  return (
    <div>
      <div className="grid gap-2 my-2">
        {relations.map((r, index) => {
          return (
            <div key={JSON.stringify(r)}>
              {r.mainTable} TO {r.relationTable} VIA {r.joinTable}{" "}
              {r.bidirectional ? "(bidirectional)" : ""}{" "}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => {
                  const newValues = relations.filter((_, i) => i !== index);

                  onChange(newValues);
                }}
              >
                <Trash />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-center">
        <div>{mainTable}</div>
        <div>TO</div>
        <Select onValueChange={(v) => setRelationTable(v)}>
          <SelectTrigger className="w-[500px]">
            <SelectValue placeholder="Select relation table" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Tables</SelectLabel>
              {tables.map((t) => {
                return (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div>VIA</div>
        <Select onValueChange={(v) => setJoinTable(v)}>
          <SelectTrigger className="w-[500px]">
            <SelectValue placeholder="Select join table" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Tables</SelectLabel>
              {tables.map((t) => {
                return (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Label>bidirectional</Label>
        <Checkbox onCheckedChange={(v) => setBidirectional(v === true)} checked={bidirectional} />

        <Button
          type="button"
          className="ml-5"
          onClick={() => {
            const newConf = {
              mainTable,
              relationTable,
              joinTable,
              bidirectional,
            };

            onChange([...relations, newConf]);
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
