frontend_dir = ui
frontend_runner = bun
bin_name = pgpanel

dev-ui:
	@cd $(frontend_dir) && $(frontend_runner) run dev

build-ui:
	@cd $(frontend_dir) && $(frontend_runner) run build

build-be:
	@go build -o ./bin/$(bin_name) main.go
	@echo "go built ✓"

run:
	@go run main.go

build: build-fe build-be
	

