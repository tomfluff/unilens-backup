import autoBind from "auto-bind";
import type { CaptureResult } from "./capture";
import type { UnilensClient } from "./UnilensClient";

export class RequestApi {
    unilens: UnilensClient;
    constructor(unilens: UnilensClient) {
        autoBind(this);
        this.unilens = unilens;
    }

    /** upload a capture to the backend. session id is provided by the UnilensClient instance. */
    async uploadCapture(cap: CaptureResult): Promise<string> {
        const backend = this.unilens.getBackend();
        const res = await fetch(`${backend}/api/capture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: cap.image,
                viewport: cap.viewportImage,
                meta: cap.meta,
                session_id: this.unilens.getSettings().continuity
                    ? this.unilens.getSessionId()
                    : null,
            }),
        });
        if (!res.ok)
            throw new Error(`capture upload failed: HTTP ${res.status}`);
        const data = await res.json();
        if (this.unilens.getSettings().continuity)
            this.unilens.setSessionId(data.session_id ?? null);
        return data.id;
    }
}
