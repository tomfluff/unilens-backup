# Wrapper for setup, teardown, build, and run

.PHONY: init clean activate serve

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
	$(RM_RF) __pycache__ **/__pycache__ 
	echo "Cleaning python intermediates"
	$(RM_RF) *.pyc *.pyo *.pyd

activate:
	@echo $(VENV_ACTIVATE)

# Run the backend, and watch for changes
serve:
	. $(VENV_ACTIVATE) && flask --app app.py --debug run
	