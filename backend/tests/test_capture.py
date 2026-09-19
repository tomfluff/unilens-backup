"""/api/capture: the optional page inventory lands in inventory.json and
nowhere else."""

import json

import app as app_module
from conftest import PNG_B64

META = {
    "url": "https://example.test/",
    "inventoryTruncated": False,
    "inventoryBytes": 42,
}
INVENTORY = [
    {"i": "n0", "r": "landmark", "n": "", "b": [0, 0, 800, 600], "v": 1},
    {"i": "n1", "r": "button", "n": "Apply", "b": [10, 10, 80, 30], "v": 1, "p": "n0"},
]


def _post_capture(client, **extra):
    body = {"image": "data:image/png;base64," + PNG_B64, "meta": META, **extra}
    res = client.post("/api/capture", json=body)
    assert res.status_code == 200, res.get_json()
    return app_module.CAPTURES_DIR / res.get_json()["id"]


def test_capture_with_inventory_writes_inventory_json(client):
    cap_dir = _post_capture(client, inventory=INVENTORY)
    assert json.loads((cap_dir / "inventory.json").read_text()) == INVENTORY
    assert json.loads((cap_dir / "meta.json").read_text()) == META


def test_capture_without_inventory_writes_no_file(client):
    cap_dir = _post_capture(client)
    assert not (cap_dir / "inventory.json").exists()
    assert json.loads((cap_dir / "meta.json").read_text()) == META


def test_capture_rejects_non_list_inventory(client):
    body = {"image": "data:image/png;base64," + PNG_B64, "meta": META, "inventory": "x"}
    res = client.post("/api/capture", json=body)
    assert res.status_code == 400
