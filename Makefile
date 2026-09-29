# Makefile to wrap the backend and frontend and run them together
-include make-include.mk
-include make-targets.mk

# Load command line args
WORD_2 ?= $(word 2, $(MAKECMDGOALS))
WORD_3 ?= $(word 3, $(MAKECMDGOALS))

# Signal to `make` that CLI args are not real targets
.PHONY: $(WORD_2) $(WORD_3)
$(WORD_2):
	@:
$(WORD_3):
	@:

define require-arg
	@if [ -z "$(WORD_2)" ]; then \
		echo "Error: No arg provided. Usage: make '$(1)' <arg>"; \
		exit 1; \
	fi
endef

define require-args-2
	@if [ -z "$(WORD_2)" ] || [ -z "$(WORD_3)" ]; then \
		echo "Error: No arg(s) provided. Usage: make $(1) <arg1> <arg2>"; \
		exit 1; \
	fi
endef

define check-dir
	@if [ -d "$(1)" ]; then \
		echo "Loading target '$(1)'"; \
	else \
		echo "'$(1)' not a directory"; \
		exit 1; \
	fi
endef


# Backend wrappers

.PHONY: init-backend clean-backend serve-backend

init-backend:
	cd $(BACKEND_DIR) && $(MAKE) init

clean-backend:
	cd $(BACKEND_DIR) && $(MAKE) clean

serve-backend:
	cd $(BACKEND_DIR) && $(MAKE) serve

format-backend:
	cd $(BACKEND_DIR) && $(MAKE) format

# Target wrappers
# These cd into the given subdir target and run the requested make command
# Standard targets: unilens, accessibility
# Usage:
#   make init-target unilens
#   make init-target accessibility

.PHONY: init-target clean-target lint-target bundle-target build-target serve-target format-target fix-target test-target

define do-target
	$(call require-arg,$(1)-target)
    $(call check-dir,$(WORD_2))
	cd $(WORD_2) && $(MAKE) $(1)
endef

init-target:
	$(call do-target,init)

clean-target:
	$(call do-target,clean)

lint-target:
	$(call do-target,lint)

bundle-target:
	$(call do-target,bundle)

build-target:
	$(call do-target,build)

serve-target:
	$(call do-target,serve)

format-target:
	$(call do-target,format)

fix-target:
	$(call do-target,fix)

test-target:
	$(call do-target,test)

# Init and clean backend, unilens lib, and self

.PHONY: init-self init-all init

init-self:
	$(NPM) install

init-all:
	@for item in $(JS_TARGETS); do \
		$(MAKE) init-target $$item || exit 1; \
	done

init: init-self init-backend init-all
	

.PHONY: clean-self clean-all clean-frontend clean

clean-self:
	$(RM_RF) node_modules

# Clean all js targets
clean-all:
	@for item in $(JS_TARGETS); do \
		$(MAKE) clean-target $$item || exit 1; \
	done

# Clean frontend targets
clean-frontend:
	@$(foreach fe,$(FRONTEND_TARGETS), \
		$(foreach js,$(JS_TARGETS), \
			$(RM_RF) $(FRONTEND_DIR)/$(fe)/$(call get_target_dist,$(js)) $(FRONTEND_DIR)/$(fe)/$(call get_target_dist,$(js)).map; \
		) \
	)

clean: clean-self clean-backend clean-all clean-frontend

# build, run, and serve (build + run)
# - `run` and the `serve` targets take a frontend target dir, such as `softbank-mirror`
# - `build` takes no argument: it always builds every JS target into every frontend.
#   For a single pair, use `build-and-copy <js-target> <frontend-target>`.

.PHONY: copy-built build-and-copy bundle-all build-all copy copy-all

# Copy from js target to frontend target
copy-built:
	$(call require-args-2,copy-built)
	cp '$(WORD_2)/dist/$(call get_target_dist,$(WORD_2))' '$(FRONTEND_DIR)/$(WORD_3)/$(call get_target_dist,$(WORD_2))'
	cp '$(WORD_2)/dist/$(call get_target_dist,$(WORD_2)).map' '$(FRONTEND_DIR)/$(WORD_3)/$(call get_target_dist,$(WORD_2)).map'

# Takes two arguments as in `make <js-target> <frontend-target>`.
# Builds `js-target` and copies `<js-target>/dist/{target}.js` into `<frontend-target>/{target.js}`
# Example: `make build unilens-lib softbank-mirror
build-and-copy:
	$(call require-args-2,build-and-copy)
	echo "Building javascript target '$(WORD_2)' to frontend target $(WORD_3)"
	$(MAKE) build-target $(WORD_2)
	$(MAKE) copy-built $(WORD_2) $(WORD_3)

# Bundle all js targets without typechecking (see `bundle` in the lib Makefiles)
bundle-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) bundle-target $$item || exit 1; \
	done

# Build all js targets
build-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) build-target $$item || exit 1; \
	done

# Copy all js targets into a single frontend target
copy:
	$(call require-arg,copy)
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) copy-built $$item $(WORD_2) || exit 1; \
	done

# Copy all js targets into all frontend targets
copy-all:
	echo "Targets: $(FRONTEND_TARGETS)"
	@for item in $(FRONTEND_TARGETS); do \
		$(MAKE) copy $$item || exit 1; \
	done

.PHONY: bundle build run serve-frontend serve

# Bundles all JS targets to all frontend targets, skipping the typecheck. The dev
# server uses this so an in-progress type error does not stop it from starting or
# rebuilding; `check` and `build` still typecheck.
bundle: bundle-all copy-all

# Typechecks and builds all JS targets to all frontend targets
build: build-all copy-all

# Runs a server from frontend/{target_dir} (without building anything)
# Passes in a port from `make-targets.mk` if it is defined
run:
	$(call require-arg,run)
	echo "Running frontend from '$(WORD_2)'"
	$(NPX) live-server $(FRONTEND_DIR)/$(WORD_2) $(call get_frontend_port,$(WORD_2))

# Builds and runs frontend from {target_dir}, watches for changes
serve-frontend:
	$(call require-arg,serve-frontend)
	$(MAKE) bundle
	echo "Serving frontend from '$(WORD_2)' to localhost:$(call get_frontend_port_num,$(WORD_2))"
	$(NPX) concurrently \
		"$(MAKE) run $(WORD_2)" \
		"$(NPX) chokidar \
			'$(FRONTEND_DIR)/$(WORD_2)/**' $(foreach t,$(JS_TARGETS),'$(t)/src/**') \
			$(foreach t,$(JS_TARGETS),--ignore '$(FRONTEND_DIR)/$(WORD_2)/$(call get_target_dist,$(t))') \
			$(foreach t,$(JS_TARGETS),--ignore '$(FRONTEND_DIR)/$(WORD_2)/$(call get_target_dist,$(t))'.map) \
			-c '$(MAKE) bundle'"

# Runs backend, builds and runs frontend from {target_dir}, watches for changes in backend or frontend
serve:
	$(call require-arg,serve)
	echo "Serving backend to 'localhost:$(FLASK_PORT)'"
	echo "Serving frontend from '$(WORD_2)' to localhost:$(call get_frontend_port_num,$(WORD_2))"
	$(NPX) concurrently \
		"$(MAKE) serve-backend" \
		"$(MAKE) serve-frontend $(WORD_2)"

# Runs the backend and every frontend at once.
# One shared watcher, not one per frontend: `build` is global, so per-frontend
# watchers would each fire a full build on the same edit and race on the same
# dist/ and frontend files. live-server handles each frontend's own reloads.
serve-all:
	$(MAKE) bundle
	@echo "Serving backend to 'localhost:$(FLASK_PORT)'"
	@$(foreach t,$(FRONTEND_TARGETS),echo "  Serving frontend '$(t)' to localhost:$(frontend_port_$(t))";)
	$(NPX) concurrently \
		"$(MAKE) serve-backend" \
		$(foreach t,$(FRONTEND_TARGETS),"$(MAKE) run $(t)") \
		"$(NPX) chokidar $(foreach t,$(JS_TARGETS),'$(t)/src/**') -c '$(MAKE) bundle'"


# Format and check rules
.PHONY: lint-all lint format-all format fix-all fix test-all check

# Typecheck all js targets
lint-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) lint-target $$item || exit 1; \
	done

# Typecheck everything. Only JS for now, like `fix`.
lint: lint-all

# Format all js targets
format-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) format-target $$item || exit 1; \
	done

# Format js targets and backend targets
format: format-backend format-all

# Fix all JS targets
fix-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) fix-target $$item || exit 1; \
	done 

# Fix everything. Only fixes JS for now. TODO: Update this with a backend linter.
fix: fix-all

# Run unit tests for every target that has them
test-all:
	echo "Targets: $(TEST_TARGETS)"
	@for item in $(TEST_TARGETS); do \
		$(MAKE) test-target $$item || exit 1; \
	done

# Unified CI check: typecheck + build all bundles, format everything, check everything, run tests
check: build format fix test-all
