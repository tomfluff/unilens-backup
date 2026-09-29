"""The widget's per-site store page (restore after a reload)."""


def test_the_store_page_is_framable_and_loads_nothing_else(client):
    res = client.get("/store")
    assert res.status_code == 200
    assert res.mimetype == "text/html"
    csp = res.headers["Content-Security-Policy"]
    assert "default-src 'none'" in csp and "frame-ancestors" not in csp
    assert "X-Frame-Options" not in res.headers
    body = res.get_data(as_text=True)
    # answers only the window that embeds it, at that window's origin, under its key
    assert "e.source !== parent" in body
    assert 'e.origin + " " + m.key' in body
