import type { CaptureResult } from "./capture";
import type { UnilensClient } from "./UnilensClient";

export class RequestApi {
    unilens: UnilensClient;
    constructor(unilens: UnilensClient) {
        this.unilens = unilens;
    }

    /**
     * upload a capture to the backend. session id is provided by the UnilensClient
     * instance. The session the upload joined or started comes back to the caller, who
     * sets it on the client once it knows the capture still belongs to the open chat.
     */
    async uploadCapture(
        cap: CaptureResult,
    ): Promise<{ id: string; sessionId: string | null }> {
        const backend = this.unilens.getBackend();
        const res = await fetch(`${backend}/api/capture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: cap.image,
                viewport: cap.viewportImage,
                meta: cap.meta,
                // beside meta, never inside it: only /api/locate reads it
                inventory: cap.inventory,
                session_id: this.unilens.getSettings().continuity
                    ? this.unilens.getSessionId()
                    : null,
            }),
        });
        if (!res.ok)
            throw new Error(`capture upload failed: HTTP ${res.status}`);
        const data = await res.json();
        return { id: data.id, sessionId: data.session_id ?? null };
    }
}
