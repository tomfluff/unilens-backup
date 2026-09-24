# Wrapper for setup, teardown, build, and run
-include ../make-include.mk
-include ../make-targets.mk

.PHONY: init clean lint bundle build serve format fix

# Build stamp: git short hash, surfaced in the init console line
BUILD_STAMP=$(shell git rev-parse --short HEAD 2>/dev/null || echo dev)

SRC_DIR=src
ESBUILD=esbuild $(SRC_DIR)/main.tsx --outfile=dist/$(target_dist_unilens-lib) --bundle  --minify --sourcemap --loader:.css=text --jsx=automatic \
	--define:__target_dist_unilens_BUILD__='"$(BUILD_STAMP)"'
# Plain --watch exits when stdin closes, which is how esbuild notices the parent
# make has gone away - that keeps a killed run from orphaning a watcher. Detached
# runs (nohup, CI) have no stdin, so they opt in: make serve WATCH=--watch=forever
WATCH?=--watch
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

# Bundle to dist/ without typechecking. The dev server's rebuild-on-save uses this:
# esbuild strips types without checking them, and tsc costs ~5x esbuild per save.
bundle:
	echo "Building dist..."
	$(NPX) $(ESBUILD)

# Full build: typecheck, then bundle. This is what `check` runs.
build: lint bundle

# Build bundled js, while watching for changes
serve:
	$(NPX) $(ESBUILD) $(WATCH)

# Runs formatter
format:
	$(NPX) $(BIOME) format $(SRC_DIR) $(BIOMEFLAGS)

# Runs formatter with (potentially unsafe) fix
fix:
	$(NPX) $(BIOME) check --unsafe $(SRC_DIR) $(BIOMEFLAGS)
