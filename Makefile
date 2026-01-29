frontend_dir = ui
frontend_runner = pnpm
bin_name = pgpanel

dev-ui:
	@cd $(frontend_dir) && $(frontend_runner) run dev

build-ui:
	@cd $(frontend_dir) && $(frontend_runner) run build

build-server:
	@go build -ldflags="-s -w" -o ./bin/$(bin_name) cmd/main.go
	@echo "server built ✓"

run-server:
	@go run cmd/main.go serve

build: build-ui build-server
	

