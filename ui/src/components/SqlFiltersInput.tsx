import { sql, SQLDialect } from "@codemirror/lang-sql";
import { githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror, { keymap } from "@uiw/react-codemirror";

import { DBTable } from "@/api/data";

interface SqlFiltersInputProps {
  table: DBTable;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
}

export function SqlFiltersInput({
  table,
  value,
  placeholder,
  onEnter,
  onChange,
}: SqlFiltersInputProps) {
  const sqlShema = table.columns.map((t) => {
    return {
      // type: "property",
      section: "columns",
      label: t.name,
    };
  });

  const keyBinding = keymap.of([
    {
      key: "Enter",
      run: () => {
        if (onEnter) {
          onEnter();
        }

        return true;
      },
    },
    {
      key: "Escape",
      run: () => {
        if (onChange) {
          onChange("");
        }

        return true;
      },
    },
  ]);

  return (
    <CodeMirror
      className="w-full sql-filters-input"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      indentWithTab={false}
      inputMode="search"
      basicSetup={{
        lineNumbers: false,
        highlightActiveLine: false,
        foldGutter: false,
        searchKeymap: false,
        defaultKeymap: false,
      }}
      theme={githubLight}
      extensions={[
        sql({
          dialect: SQLDialect.define({
            operatorChars: "*+-%<>!=&|/~",
            keywords:
              "and or not between in like ilike is null is not null exists any all some case when then else end" +
              "lower upper length substring trim replace date time timestamp now extract to_char",
          }),
          schema: sqlShema,
          upperCaseKeywords: true,
        }),
        keyBinding,
      ]}
    />
  );
}
