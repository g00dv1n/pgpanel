frontend_dir = ui
frontend_runner = bun
bin_name = pgpanel

dev-ui:
	@cd $(frontend_dir) && $(frontend_runner) run dev

build-ui:
	@cd $(frontend_dir) && $(frontend_runner) run build

build-server:
	@go build -ldflags="-s -w" -o ./bin/$(bin_name) main.go
	@echo "go built ✓"

run-server:
	@go run main.go

build: build-ui build-server
	

