package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CrudService struct {
	db     *pgxpool.Pool
	schema *SchemaRepository
	logger *slog.Logger
}

func NewCrudService(db *pgxpool.Pool, schema *SchemaRepository, logger *slog.Logger) *CrudService {
	return &CrudService{db: db, schema: schema, logger: logger}
}

func (s CrudService) queryAsJson(sql string, args []any) (json.RawMessage, error) {
	jsonSqlWrapper := fmt.Sprintf(`
		WITH q as (%s)
		SELECT 
			COALESCE(json_agg(row_to_json(q)), '[]'::json) as result
		FROM q
	`, sql)

	row := s.db.QueryRow(context.TODO(), jsonSqlWrapper, args...)

	var result json.RawMessage
	err := row.Scan(&result)

	return result, err
}

// ---------------------- Universal Get Rows -------------------------------
var getRowsSQL = SqlT(`
	SELECT {{ .Select }}
	FROM {{.From}}
	{{.Where}}
	{{.OrderBy}}
	LIMIT {{.Limit}}
	OFFSET {{.Offset}}
`)

func (s CrudService) GetRows(tableName string, params *GetRowsParams) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	tableSettings, err := s.schema.GetTableSettings(tableName)

	if err != nil {
		return nil, err
	}

	if params == nil {
		params = DefaultGetRowsParams()
	}

	// filters can be nil because it is an interface
	if params.Filters == nil {
		params.Filters = SQLFilters{}
	}

	// apply default sorting for consistency
	if params.Sorting.IsEmpty() {
		params.Sorting = DefaultTableSorting(table)
	}

	if params.SelectColumns.IsEmpty() {
		params.SelectColumns = NewSelectColumnsFromTableSettings(table, tableSettings)
	}

	selectColumns := params.SelectColumns.ToSQL(table)
	where, args := params.Filters.ToSQL(table)
	orderBy := params.Sorting.ToSQL()

	sql := getRowsSQL.Exec(map[string]any{
		"Select":  selectColumns,
		"From":    table.SafeName(),
		"Where":   where,
		"OrderBy": orderBy,
		"Limit":   params.Pagination.Limit,
		"Offset":  params.Pagination.Offset,
	})

	return s.queryAsJson(sql, args)
}

// ---------------------- Universal Update Rows -------------------------------
type RawRow map[string]any

func (rr RawRow) ToUpdateSQL(table *Table, paramsOffset int) (string, []any) {
	i := 1

	args := make([]any, 0, len(rr))
	updates := make([]string, 0, len(rr))

	for columnName, value := range rr {
		// Check if this column exists in table and skip if not exists
		if _, validColumn := table.GetColumn(columnName); !validColumn {
			continue
		}

		updates = append(updates, fmt.Sprintf(`"%s" = $%d`, columnName, i+paramsOffset))
		args = append(args, value)
		i += 1
	}

	sql := strings.Join(updates, ", ")

	return sql, args
}

var updateRowsSQL = SqlT(`
	UPDATE {{.TableName}}
	SET {{.Updates}}
	{{.Where}}
	RETURNING *
`)

func (s CrudService) UpdateRows(tableName string, filters Filters, row RawRow) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, whereArgs := filters.ToSQL(table)
	updates, updatesArgs := row.ToUpdateSQL(table, len(whereArgs))

	if len(updates) == 0 {
		return nil, errors.New("can't update rows with zero valid columns")
	}

	args := append(whereArgs, updatesArgs...)

	sql := updateRowsSQL.Exec(map[string]any{
		"TableName": table.SafeName(),
		"Updates":   updates,
		"Where":     where,
	})

	return s.queryAsJson(sql, args)
}

// ---------------------- Universal Insert Row -------------------------------
func (rr RawRow) ToInsertSQL(table *Table, paramsOffset int) (string, string, []any) {
	i := 1

	insertColumns := make([]string, 0, len(rr))
	insertValues := make([]string, 0, len(rr))
	args := make([]any, 0, len(rr))

	for columnName, value := range rr {
		// Check if this column exists in table and skip if not exists
		col, validColumn := table.GetColumn(columnName)
		if !validColumn {
			continue
		}

		insertColumns = append(insertColumns, col.SafeName())
		insertValues = append(insertValues, fmt.Sprintf("$%d", i+paramsOffset))
		args = append(args, value)
		i += 1
	}

	if len(insertColumns) == 0 {
		return "", "", nil
	}

	return fmt.Sprintf("(%s)", strings.Join(insertColumns, ",")), fmt.Sprintf("(%s)", strings.Join(insertValues, ",")), args
}

var insertRowSQL = SqlT(`
	INSERT INTO {{.TableName}} {{.Columns}}
	VALUES {{.Values}}
	RETURNING *
`)

func (s CrudService) InsertRow(tableName string, row RawRow) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	insertColumns, insertValues, args := row.ToInsertSQL(table, 0)

	if len(insertColumns) == 0 {
		return nil, errors.New("can't insert row with zero valid columns")
	}

	sql := insertRowSQL.Exec(map[string]any{
		"TableName": table.SafeName(),
		"Columns":   insertColumns,
		"Values":    insertValues,
	})

	return s.queryAsJson(sql, args)
}

// ---------------------- Universal Delete Rows -------------------------------
var deleteRowsSQL = SqlT(`
	DELETE FROM {{.TableName}} 
	{{.Where}}
	RETURNING *
`)

func (s CrudService) DeleteRows(tableName string, filters Filters) (json.RawMessage, error) {
	table, err := s.schema.GetTable(tableName)

	if err != nil {
		return nil, err
	}

	where, args := filters.ToSQL(table)

	if len(where) == 0 {
		return nil, errors.New("can't delete rows with empty filters")
	}

	sql := deleteRowsSQL.Exec(map[string]any{
		"TableName": table.SafeName(),
		"Where":     where,
	})

	return s.queryAsJson(sql, args)
}

// ---------------------- Relations -------------------------------

var getRelatedRows = SqlT(`
	SELECT {{.Select}}
	FROM {{.RelationTable}}
	JOIN {{.JoinTable}} ON {{.JoinTable}}.{{.RelationJoinCol}} = {{.RelationTable}}.{{.RelationTableCol}}
	WHERE {{.JoinTable}}.{{.MainJoinCol}} = $1
`)

type relationData struct {
	mainTable     *Table
	relationTable *Table
	joinTable     *Table

	mainJoinCol      *Column
	relationJoinCol  *Column
	relationTableCol *Column
}

func (s CrudService) getRelationData(relation *RelationsConfig) (*relationData, error) {
	mainTable, err := s.schema.GetTable(relation.MainTable)
	if err != nil {
		return nil, errors.New("unknown mainTable")
	}
	relationTable, err := s.schema.GetTable(relation.RelationTable)
	if err != nil {
		return nil, errors.New("unknown relationTable")
	}
	joinTable, err := s.schema.GetTable(relation.JoinTable)
	if err != nil {
		return nil, errors.New("unknown joinTable")
	}

	var mainJoinCol *Column
	var relationJoinCol *Column
	var ok bool

	// handle edge case where MainTable and RelationTable are the same
	if relation.MainTable == relation.RelationTable {
		cols := joinTable.GetForeignKeyColumnsByTable(relation.MainTable)

		if len(cols) < 2 {
			return nil, errors.New("can't get mainJoinCol, relationJoinCol")
		}

		mainJoinCol = &cols[0]
		relationJoinCol = &cols[1]

	} else {
		mainJoinCol, ok = joinTable.GetForeignKeyColumnByTable(mainTable.Name)
		if !ok {
			return nil, errors.New("can't get mainJoinCol")
		}

		relationJoinCol, ok = joinTable.GetForeignKeyColumnByTable(relationTable.Name)
		if !ok {
			return nil, errors.New("can't get relationJoinCol")
		}
	}

	relationTableCol, ok := relationTable.GetColumn(relationJoinCol.ForeignKey.ColumnName)
	if !ok {
		return nil, errors.New("can't get relationTableCol")
	}

	return &relationData{
		mainTable:     mainTable,
		relationTable: relationTable,
		joinTable:     joinTable,

		mainJoinCol:      mainJoinCol,
		relationJoinCol:  relationJoinCol,
		relationTableCol: relationTableCol,
	}, nil
}

// Return all related rows for specific main table row ID
func (s CrudService) GetRelatedRows(relation *RelationsConfig, mainTableRowId any) (json.RawMessage, error) {
	rd, err := s.getRelationData(relation)

	if err != nil {
		return nil, err
	}

	selectColumns := strings.Join(rd.relationTable.SafeColumnNames(), ",")
	params := map[string]string{
		"Select":        selectColumns,
		"RelationTable": rd.relationTable.SafeName(),
		"JoinTable":     rd.joinTable.SafeName(),

		"MainJoinCol":      rd.mainJoinCol.SafeName(),
		"RelationJoinCol":  rd.relationJoinCol.SafeName(),
		"RelationTableCol": rd.relationTableCol.SafeName(),
	}

	sql := getRelatedRows.Exec(&params)
	args := []any{mainTableRowId}

	return s.queryAsJson(sql, args)
}

var deleteRelatedRow = SqlT(`
    DELETE FROM {{.JoinTable}}
    WHERE {{.MainJoinCol}} = $1 AND {{.RelationJoinCol}} = $2
`)

var insertRelatedRow = SqlT(`
    INSERT INTO {{.JoinTable}} ({{.MainJoinCol}}, {{.RelationJoinCol}})
    VALUES ($1, $2)
    ON CONFLICT ({{.MainJoinCol}}, {{.RelationJoinCol}}) DO NOTHING
`)

type UpdateRelatedRowsActions struct {
	AddIds    []any `json:"addIds"`
	DeleteIds []any `json:"deleteIds"`
}

func (s CrudService) UpdateRelatedRows(relation *RelationsConfig, mainTableRowId any, actions *UpdateRelatedRowsActions) error {
	rd, err := s.getRelationData(relation)
	if err != nil {
		return err
	}

	params := map[string]string{
		"JoinTable":       rd.joinTable.SafeName(),
		"MainJoinCol":     rd.mainJoinCol.SafeName(),
		"RelationJoinCol": rd.relationJoinCol.SafeName(),
	}

	ctx := context.Background()

	// Start transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Process deletions
	deleteSQL := deleteRelatedRow.Exec(&params)
	for _, deleteId := range actions.DeleteIds {
		// Delete main direction
		if _, err := tx.Exec(ctx, deleteSQL, mainTableRowId, deleteId); err != nil {
			return err
		}

		// If bidirectional, delete reverse direction
		if relation.Bidirectional {
			if _, err := tx.Exec(ctx, deleteSQL, deleteId, mainTableRowId); err != nil {
				return err
			}
		}
	}

	// Process additions
	insertSQL := insertRelatedRow.Exec(&params)
	for _, addId := range actions.AddIds {
		// Insert main direction
		if _, err := tx.Exec(ctx, insertSQL, mainTableRowId, addId); err != nil {
			return err
		}

		// If bidirectional, insert reverse direction
		if relation.Bidirectional {
			if _, err := tx.Exec(ctx, insertSQL, addId, mainTableRowId); err != nil {
				return err
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}
