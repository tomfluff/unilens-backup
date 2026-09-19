def test_health_reports_stub_provider(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok", "provider": "stub"}
