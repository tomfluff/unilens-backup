# JS build targets

# Define all targets here, this allows us to iterate through them
JS_TARGETS:= unilens-lib accessibility-lib

target_dist_unilens-lib=unilens.js
target_dist_accessibility-lib=accessibility.js

# Frontend build targets
FRONTEND_TARGETS:= softbank-mirror softbank-mirror-recruit dev-demo

# To add a target, use the format `frontend_port_{subdir name}=<PORT>`
frontend_port_softbank-mirror=8000
frontend_port_dev-demo=8001
frontend_port_softbank-mirror-recruit=8002

# Functions to fetch targets as a key-value map
get_target_dist=$(target_dist_$(1))
get_frontend_port_num=$(frontend_port_$(1))
get_frontend_port=$(if $(frontend_port_$(1)),--port=$(frontend_port_$(1)),)