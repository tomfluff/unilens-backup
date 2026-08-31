# Wrapper for setup, teardown, build, and run
-include ../make-include.mk
-include ../make-targets.mk

.PHONY: init clean build serve format fix

# Build stamp: git short hash, surfaced in the init console line
BUILD_STAMP=$(shell git rev-parse --short HEAD 2>/dev/null || echo dev)

SRC_DIR=src
ESBUILD=esbuild $(SRC_DIR)/main.tsx --outfile=dist/$(target_dist_unilens-lib) --bundle  --minify --sourcemap --loader:.css=text --jsx=automatic \
	--define:__target_dist_unilens_BUILD__='"$(BUILD_STAMP)"'
BIOME=@biomejs/biome
BIOMEFLAGS=--config-path ./biome.json --write

init:
	echo "Setting up npm dependencies"
	$(NPM) install

clean:
	echo "Cleaning node_modules and build files"
	$(RM_RF) node_modules
	$(RM_RF) dist

# Build bundled js out to dist/ (typecheck first — esbuild strips types without checking them)
build:
	echo "Building dist..."
	$(NPX) $(ESBUILD)

# Build bundled js, while watching for changes
serve:
	$(NPX) $(ESBUILD) --watch

# Runs formatter
format:
	$(NPX) $(BIOME) format $(SRC_DIR) $(BIOMEFLAGS)

# Runs formatter with (potentially unsafe) fix
fix:
	$(NPX) $(BIOME) check --unsafe $(SRC_DIR) $(BIOMEFLAGS)
