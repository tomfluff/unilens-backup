# Wrapper for setup, teardown, build, and run
-include ../make-include.mk

.PHONY: init clean activate serve test format

PYTHON=python3
PIP=pip
VENV_DIR=.venv
RM_RF=rm -rf

VENV_ACTIVATE=$(VENV_DIR)/bin/activate

init:
	echo "Setting up venv"
	$(PYTHON) -m venv $(VENV_DIR)
	. $(VENV_ACTIVATE) && $(PIP) install -r requirements.txt

clean:
	echo "Cleaning venv"
	$(RM_RF) $(VENV_DIR)
	echo "Cleaning pycache"
	find . -type d -name __pycache__ -exec $(RM_RF) {} +
	echo "Cleaning python intermediates"
	$(RM_RF) *.pyc *.pyo *.pyd

activate:
	@echo $(VENV_ACTIVATE)

# Run the backend, and watch for changes
serve:
	. $(VENV_ACTIVATE) && flask --app app.py --debug run --port $(FLASK_PORT)

# Runs the unit tests
test:
	. $(VENV_ACTIVATE) && pytest -q

# Runs the formatter
format:
	. $(VENV_ACTIVATE) && black app.py tests
