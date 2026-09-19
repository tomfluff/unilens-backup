"""/api/capture: the optional page inventory lands in inventory.json and
nowhere else."""

import json

import pytest

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


def _post_bad(client, inventory):
    body = {"image": "data:image/png;base64," + PNG_B64, "meta": META}
    body["inventory"] = inventory
    res = client.post("/api/capture", json=body)
    assert not list(app_module.CAPTURES_DIR.iterdir())  # nothing written
    return res


def test_capture_rejects_non_list_inventory(client):
    assert _post_bad(client, "x").status_code == 400


ROOT = {"i": "n0", "r": "landmark", "n": "", "b": [0, 0, 1, 1], "v": 1}
GOOD = {"i": "n1", "r": "text", "n": "x", "b": [0, 0, 1, 1], "v": 1, "p": "n0"}


def _node(**over):
    node = {**GOOD, **over}
    return {k: v for k, v in node.items() if v is not ...}


BAD_NODES = {
    "not an object": "n1",
    "missing v": _node(v=...),
    "extra key": _node(x=1),
    "id wrong prefix": _node(i="N1"),
    "id too long": _node(i="n123456"),
    "id not a string": _node(i=1),
    "bad role": _node(r="div"),
    "n not a string": _node(n=1),
    "n too long": _node(n="x" * 1001),
    "t not a string": _node(t=[]),
    "t too long": _node(t="x" * 1001),
    "b wrong length": _node(b=[0, 0, 1]),
    "b not ints": _node(b=[0, 0, 1, 1.5]),
    "b bools": _node(b=[0, 0, True, 1]),
    "v out of range": _node(v=2),
    "v bool": _node(v=True),
    "s bad token": _node(s="checked hovered"),
    "s not a string": _node(s=["checked"]),
    "p bad syntax": _node(p="x0"),
    "p unknown": _node(p="n9"),
    "p is itself": _node(p="n1"),
}


@pytest.mark.parametrize("node", BAD_NODES.values(), ids=list(BAD_NODES))
def test_capture_rejects_a_bad_node(client, node):
    res = _post_bad(client, [ROOT, node])
    assert res.status_code == 400
    assert res.get_json()["error"].startswith("inventory node 1:")


def test_capture_accepts_every_optional_field(client):
    node = _node(t="region text", s="checked expanded")
    cap_dir = _post_capture(client, inventory=[ROOT, node])
    assert json.loads((cap_dir / "inventory.json").read_text()) == [ROOT, node]


def test_capture_rejects_duplicate_ids(client):
    res = _post_bad(client, [ROOT, _node(i="n0")])
    assert res.status_code == 400
    assert res.get_json()["error"] == "inventory node 1: duplicate id n0"


def test_capture_rejects_p_pointing_at_a_later_node(client):
    later = _node(i="n1", p="n2")
    res = _post_bad(client, [ROOT, later, _node(i="n2")])
    assert res.status_code == 400
    assert (
        res.get_json()["error"]
        == "inventory node 1: p must be the id of an earlier node"
    )


def test_capture_rejects_too_many_nodes(client):
    nodes = [ROOT] + [_node(i=f"n{k}") for k in range(1, 5001)]
    res = _post_bad(client, nodes)
    assert res.status_code == 413
    assert res.get_json() == {"error": "too many inventory nodes"}


def test_capture_rejects_an_oversized_inventory(client):
    nodes = [ROOT] + [_node(i=f"n{k}", n="x" * 300) for k in range(1, 4000)]
    assert len(json.dumps(nodes)) > 1_000_000
    res = _post_bad(client, nodes)
    assert res.status_code == 413
    assert res.get_json() == {"error": "inventory too large"}
