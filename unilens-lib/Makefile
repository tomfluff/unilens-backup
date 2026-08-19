# Wrapper for setup, teardown, build, and run
-include ../make-include.mk
-include ../make-targets.mk

.PHONY: init clean lint build serve

# Build stamp: git short hash, surfaced in the init console line
BUILD_STAMP=$(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
ESBUILD=esbuild src/main.tsx --outfile=dist/$(target_dist_unilens-lib) --bundle  --minify --sourcemap \
	--define:__target_dist_unilens_BUILD__='"$(BUILD_STAMP)"'

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

# Build bundled js out to dist/ (typecheck first — esbuild strips types without checking them)
build: lint
	echo "Building dist..."
	$(NPX) $(ESBUILD)

# Build bundled js, while watching for changes
serve:
	$(NPX) $(ESBUILD) --watch