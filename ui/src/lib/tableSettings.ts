import { OverriddenInputsMap } from "@/components/form/InputsRegistry";
import { DataRow } from "@/lib/dataRow";
import { Row } from "@/lib/pgTypes";

export interface TableSettings {
  viewLinkPattern: string | null;
  overriddenInputs: OverriddenInputsMap | null;
  relations?: RelationsConfig[];
}

export interface RelationsConfig {
  mainTable: string;
  relationTable: string;
  joinTable: string;
  bidirectional?: boolean;
}

// pattern format: 'https://admin.example.com/users/{user_id}/{role_id}'
// user_id is a column name
export function generateViewLink(pattern: string, row: Row | DataRow) {
  let link = pattern;

  for (const [column, value] of Object.entries(row)) {
    if (!value) continue;

    const urlValue = encodeURIComponent(value.toString());

    link = link.replaceAll(`{${column}}`, urlValue);
  }

  return link;
}
