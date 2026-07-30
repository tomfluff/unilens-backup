# Makefile to wrap the backend and frontend and run them together

# Load command line args
WORD_2 ?= $(word 2, $(MAKECMDGOALS))

# Signal to `make` that CLI args are not real targets
.PHONY: $(WORD_2)
$(WORD_2):
	@:

# Set shared bins
NPM=npm
NPX=npx
PYTHON=python3
RM_RF=rm -rf

# Set shared vars
BACKEND_DIR=backend
UNILENS_DIR=unilens-lib
UNILENS=unilens.js

# Backend wrappers

.PHONY: init-backend clean-backend serve-backend

init-backend:
	cd $(BACKEND_DIR) && $(MAKE) init

clean-backend:
	cd $(BACKEND_DIR) && $(MAKE) clean

serve-backend:
	cd $(BACKEND_DIR) && $(MAKE) serve

# Unilens wrappers

.PHONY: init-unilens clean-unilens build-unilens serve-unilens

init-unilens:
	cd $(UNILENS_DIR) && $(MAKE) init

clean-unilens:
	cd $(UNILENS_DIR) && $(MAKE) clean

build-unilens:
	cd $(UNILENS_DIR) && $(MAKE) build

serve-unilens:
	cd $(UNILENS_DIR) && $(MAKE) serve

# Init and clean backend, unilens lib, and self

.PHONY: init clean

init: init-backend init-unilens
	$(NPM) install

clean: clean-backend clean-unilens
	$(RM_RF) node_modules

# build, run, and serve (build + run)
# - All build/run/serve targets can take either a target dir, such as `softbank-mirror`

.PHONY: build serve-frontend serve

define require-dir
	@if [ -z "$(WORD_2)" ]; then \
		echo "Error: No directory provided. Usage: make $(1) <directory>"; \
		exit 1; \
	fi
endef

# Builds unilens lib, then distributes it to {target_dir}/unilens.js
UNILENS_DIST=$(UNILENS_DIR)/dist
build:
	$(call require-dir,build)
	echo "Building target '$(WORD_2)'"
	$(MAKE) build-unilens
	cp '$(UNILENS_DIST)/$(UNILENS)' '$(WORD_2)/$(UNILENS)'

# Runs a server from {target_dir} (without building anything)
run:
	$(call require-dir,run)
	echo "Running frontend from '$(WORD_2)'"
	$(NPX) live-server $(WORD_2)

# Builds and runs frontend from {target_dir}, watches for changes
serve-frontend:
	$(call require-dir,serve-frontend)
	echo "Serving frontend from '$(WORD_2)' to localhost:8000"
	$(NPX) concurrently \
		"$(MAKE) run $(WORD_2)" \
		"$(NPX) chokidar \
			'$(UNILENS_DIR)/src/**' '$(WORD_2)/**' \
			--ignore '$(WORD_2)/$(UNILENS)' \
			-c '$(MAKE) build $(WORD_2)'"

# Runs backend, builds and runs frontend from {target_dir}, watches for changes in backend or frontend
serve:
	$(call require-dir,serve)
	echo "Serving backend to 'localhost:5000"
	echo "Serving frontend from '$(WORD_2)' to localhost:8000"
	$(NPX) concurrently \
		"$(MAKE) serve-backend" \
		"$(MAKE) serve-frontend $(WORD_2)"