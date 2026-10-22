# Wrapper for setup, teardown, build, and run
-include ../make-include.mk

.PHONY: init clean lint bundle build serve test format fix db-up db-down db-table db-import serve-dynamodb

SRC_DIR=src
ESBUILD=esbuild src/server.ts src/tools/createTable.ts src/tools/importJsonl.ts --outdir=dist --entry-names=[name] --bundle --splitting --platform=node --format=esm --packages=external --sourcemap
BIOME=@biomejs/biome
BIOMEFLAGS=--config-path ./biome.json --write

init:
	echo "Setting up npm dependencies"
	$(NPM) install

clean:
	echo "Cleaning node_modules and build files"
	$(RM_RF) node_modules
	$(RM_RF) dist

# Lint (without building)
lint:
	echo "Running type checker..."
	$(NPX) tsc -b

test:
	echo "Running unit tests..."
	$(NPX) vitest run

# Bundle to dist/ without typechecking
bundle:
	echo "Building dist..."
	$(NPX) $(ESBUILD)

# Full build: typecheck, then bundle. This is what `check` runs.
build: lint bundle

# Run the server on SURVEY_PORT, rebuilding and restarting on every save
serve:
	SURVEY_PORT=$(SURVEY_PORT) $(NPX) npm run dev

# Runs formatter
format:
	$(NPX) $(BIOME) format $(SRC_DIR) $(BIOMEFLAGS)

# Runs formatter with (potentially unsafe) fix
fix:
	$(NPX) $(BIOME) check --unsafe $(SRC_DIR) $(BIOMEFLAGS)

# DynamoDB Local (docker-compose.yml, port 8100) and the server on it.
# Settings for these are in dynamodb-local.env.
db-up:
	$(NPM) run db:up

db-down:
	$(NPM) run db:down

# Create the answers' table (once)
db-table:
	$(NPM) run db:table

# Copy quiz-logs/*.jsonl into the table (safe to run again)
db-import:
	$(NPM) run db:import

serve-dynamodb:
	SURVEY_PORT=$(SURVEY_PORT) $(NPM) run dev:dynamodb
