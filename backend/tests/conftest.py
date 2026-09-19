"""Shared fixtures for the backend tests.

app.py fixes its storage dirs, guardrails, rate limits and provider choice as
module globals at import time, so each test gets a fresh copy of every one of
them (dirs under tmp_path, no API keys, so _provider() is "stub") and nothing
leaks between tests.
"""

import sys
from pathlib import Path

import pytest

# app.py is a bare module in backend/, not a package: put backend/ on the path.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as app_module  # noqa: E402

# 1x1 transparent PNG; the stub never decodes it but the routes read the file.
PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="


@pytest.fixture
def client(tmp_path, monkeypatch):
    captures = tmp_path / "captures"
    sessions = tmp_path / "sessions"
    captures.mkdir()
    sessions.mkdir()
    monkeypatch.setattr(app_module, "CAPTURES_DIR", captures)
    monkeypatch.setattr(app_module, "SESSIONS_DIR", sessions)
    monkeypatch.setattr(app_module, "GUARDRAILS", False)
    monkeypatch.setattr(app_module, "MAX_CAPTURES", 500)
    monkeypatch.setattr(app_module, "RETENTION_DAYS", 30)
    monkeypatch.setattr(app_module, "RATE_LIMITS", dict(app_module.RATE_LIMITS))
    monkeypatch.setattr(app_module, "_rate", {})
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    flask_app = app_module.create_app()
    flask_app.config["TESTING"] = True
    return flask_app.test_client()
