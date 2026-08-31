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

.PHONY: init-target clean-target build-target serve-target

define do-target
	$(call require-arg,$(1)-target)
    $(call check-dir,$(WORD_2))
	cd $(WORD_2) && $(MAKE) $(1)
endef

init-target:
	$(call do-target,init)

clean-target:
	$(call do-target,clean)

build-target:
	$(call do-target,build)

serve-target:
	$(call do-target,serve)

format-target:
	$(call do-target,format)

# Init and clean backend, unilens lib, and self

.PHONY: init-self init-targets-all init 

init-self:
	$(NPM) install

init-all:
	@for item in $(JS_TARGETS); do \
		$(MAKE) init-target $$item; \
	done

init: init-self init-backend init-all
	

.PHONY: clean-self clean-all clean-frontend clean

clean-self:
	$(RM_RF) node_modules

# Clean all js targets
clean-all:
	@for item in $(JS_TARGETS); do \
		$(MAKE) clean-target $$item; \
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
# - All build/run/serve targets can take either a target dir, such as `softbank-mirror`

.PHONY: copy-built build-and-copy build-all copy copy-all

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

# Build all js targets
build-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) build-target $$item; \
	done

# Copy all js targets into a single frontend target
copy:
	$(call require-arg,copy)
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) copy-built $$item $(WORD_2); \
	done

# Copy all js targets into all frontend targets
copy-all:
	echo "Targets: $(FRONTEND_TARGETS)"
	@for item in $(FRONTEND_TARGETS); do \
		$(MAKE) copy $$item; \
	done

.PHONY: build run serve-frontend serve

# Builds all JS targets to all frontend targets
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
	echo "Serving frontend from '$(WORD_2)' to localhost:$(call get_frontend_port,$(WORD_2))"
	$(NPX) concurrently \
		"$(MAKE) run $(WORD_2)" \
		"$(NPX) chokidar \
			'$(WORD_2)/**' $(foreach t,$(JS_TARGETS),'$(t)/src/**') \
			$(foreach t,$(JS_TARGETS),--ignore '$(WORD_2)/$(call get_target_dist,$(t))') \
			$(foreach t,$(JS_TARGETS),--ignore '$(WORD_2)/$(call get_target_dist,$(t))'.map) \
			-c '$(MAKE) build $(WORD_2)'"

# Runs backend, builds and runs frontend from {target_dir}, watches for changes in backend or frontend
serve:
	$(call require-arg,serve)
	echo "Serving backend to 'localhost:5000"
	echo "Serving frontend from '$(WORD_2)' to localhost:$(call get_frontend_port,$(WORD_2))"
	$(NPX) concurrently \
		"$(MAKE) serve-backend" \
		"$(MAKE) serve-frontend $(WORD_2)"

# Runs `make serve` on all frontend targets
serve-all:
	$(MAKE) build
	@echo "Serving backend to 'localhost:$(FLASK_PORT)'"
	@$(foreach t,$(FRONTEND_TARGETS),echo "  Serving frontend '$(t)' to localhost:$(frontend_port_$(t))";)
	$(NPX) concurrently \
		"$(MAKE) serve-backend" \
		$(foreach t,$(FRONTEND_TARGETS),"$(MAKE) serve-frontend $(t)")


# Format rules
.PHONY: format-all format
# format all js targets
format-all:
	echo "Targets: $(JS_TARGETS)"
	@for item in $(JS_TARGETS); do \
		$(MAKE) format-target $$item; \
	done

# Format js targets and backend targets
format:
	$(MAKE) format-backend
	$(MAKE) format-all