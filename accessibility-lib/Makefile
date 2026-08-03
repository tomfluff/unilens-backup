# Wrapper for setup, teardown, build, and run
-include ../make-include.mk
-include ../make-targets.mk

.PHONY: init clean lint build serve

ESBUILD=esbuild src/main.tsx --outfile=dist/$(target_dist_accessibility-lib) --bundle  --minify --sourcemap

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

# Build bundled js out to dist/
build:
	echo "Building dist..."
	$(NPX) $(ESBUILD)

# Build bundled js, while watching for changes
serve:
	$(NPX) $(ESBUILD) --watch