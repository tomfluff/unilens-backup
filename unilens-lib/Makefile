# Wrapper for setup, teardown, build, and run

.PHONY: init clean build

NPM=npm
NPX=npx
VENV_DIR=.venv
RM_RF=rm -rf

init:
	echo "Setting up npm dependencies"
	$(NPM) install

clean:
	echo "Cleaning node_modules and build files"
	$(RM_RF) node_modules
	$(RM_RF) dist

# Build bundled js out to dist/
build:
	echo "Running type checker..."
	$(NPX) tsc -b
	echo "Building dist..."
	$(NPX) vite build

# Build bundled js, while watching for changes
serve:
	$(NPX) chokidar "src/**" -c "$(MAKE) build"