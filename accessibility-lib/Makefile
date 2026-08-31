# Wrapper for setup, teardown, build, and run
-include ../make-include.mk
-include ../make-targets.mk

.PHONY: init clean build serve test format check

SRC_DIR=src
ESBUILD=esbuild src/main.tsx --outfile=dist/$(target_dist_accessibility-lib) --bundle --minify --sourcemap --loader:.css=text --jsx=automatic
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

# Build bundled js out to dist/
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
check:
	$(NPX) $(BIOME) check --unsafe $(SRC_DIR) $(BIOMEFLAGS)