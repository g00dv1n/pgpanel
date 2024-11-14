package core

import "text/template"

func sqlTempl(sql string) *template.Template {
	return template.Must(template.New("sql").Parse(sql))
}
