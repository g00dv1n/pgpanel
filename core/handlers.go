package core

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/g00dv1n/pgpanel/ui"
)

// ---------------------- API types -------------------------------
type ApiHandler func(w http.ResponseWriter, r *http.Request) error

type ApiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func NewApiError(code int, err error) ApiError {
	return ApiError{
		Code:    code,
		Message: err.Error(),
	}
}

func (e ApiError) Error() string {
	return e.Message
}

// ---------------------- Data API Handleers -------------------------------
func (app *App) getTablesHandler(w http.ResponseWriter, r *http.Request) error {
	return json.NewEncoder(w).Encode(app.TablesRepo.tablesMap)
}

func (app *App) getRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	params := ParseGetRowsParamsFromQuery(r.URL.Query())

	data, err := app.TablesRepo.GetRows(tableName, params)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	_, err = w.Write(data)
	return err
}

func (app *App) insertRowHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")

	var row RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	data, err := app.TablesRepo.InsertRow(tableName, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	_, err = w.Write(data)
	return err
}

func (app *App) updateRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	var row RawRow
	if err := json.NewDecoder(r.Body).Decode(&row); err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	data, err := app.TablesRepo.UpdateRows(tableName, filters, row)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	_, err = w.Write(data)
	return err
}

func (app *App) deleteRowsHandler(w http.ResponseWriter, r *http.Request) error {
	tableName := r.PathValue("table")
	filters := ParseFiltersFromQuery(r.URL.Query())

	data, err := app.TablesRepo.DeleteRows(tableName, filters)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	_, err = w.Write(data)
	return err
}

// ---------------------- Admin API Handleers -------------------------------
type LoginCreds struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func (app *App) adminLoginHandler(w http.ResponseWriter, r *http.Request) error {
	var creds LoginCreds
	err := json.NewDecoder(r.Body).Decode(&creds)

	if err != nil {
		return NewApiError(http.StatusBadRequest, err)
	}

	if creds.Username != "admin" {
		return NewApiError(http.StatusUnauthorized, errors.New("can't find this admin user"))
	}

	if creds.Password != "admin" {
		return NewApiError(http.StatusUnauthorized, errors.New("invalid password"))
	}

	token, err := GenerateToken(creds.Username, 24*time.Hour)

	if err != nil {
		return NewApiError(http.StatusUnauthorized, err)
	}

	res := LoginResponse{
		Token: token,
	}

	return json.NewEncoder(w).Encode(&res)
}

// ------------------------- ALL APP Routes ---------------------------------
func (app *App) Routes() *http.ServeMux {
	root := http.NewServeMux()

	//------- Register embeded fronted serving ------
	root.Handle("/", ui.Handler())
	//-----------------------------------------------

	// -------Set Up API Roputer with /api prefix----
	api := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", api))

	// --------------DATA API ENDPOINTS-------------------
	api.Handle("GET /schema/tables", createApiHandler(app.getTablesHandler, AuthMiddleware))

	api.Handle("GET /data/{table}", createApiHandler(app.getRowsHandler, AuthMiddleware))
	api.Handle("POST /data/{table}", createApiHandler(app.insertRowHandler, AuthMiddleware))
	api.Handle("PUT /data/{table}", createApiHandler(app.updateRowsHandler, AuthMiddleware))
	api.Handle("DELETE /data/{table}", createApiHandler(app.deleteRowsHandler, AuthMiddleware))
	// --------------ADMIN API ENDPOINTS-------------------
	api.Handle("POST /admin/login", createApiHandler(app.adminLoginHandler))

	return root
}

func createApiHandler(handler ApiHandler, middlewares ...ApiMiddleware) http.HandlerFunc {
	h := Chain(handler, middlewares...)

	return func(w http.ResponseWriter, r *http.Request) {
		// In api we always return json (for error as well)
		w.Header().Add("Content-Type", "application/json")

		if err := h(w, r); err != nil {
			apiErr, ok := err.(ApiError)
			if !ok {
				apiErr = NewApiError(http.StatusInternalServerError, err)
			}

			w.WriteHeader(apiErr.Code)
			json.NewEncoder(w).Encode(&apiErr)

			return
		}
	}
}
