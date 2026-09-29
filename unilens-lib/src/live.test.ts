import { afterEach, describe, expect, it, vi } from "vitest";
import {
    functionResponse,
    replyEnds,
    spoken,
    startLive,
    to16k,
    toolCall,
} from "./live";

describe("to16k", () => {
    it("keeps one sample in three at 48 kHz, across chunk edges, as PCM16", () => {
        const down = to16k(48000);
        const ramp = Float32Array.from({ length: 10 }, (_, i) => i / 10);
        const a = down(ramp.subarray(0, 4)); // samples 0 and 3
        const b = down(ramp.subarray(4)); // then 6 and 9: the step carries over
        expect([...a, ...b]).toEqual(
            [0, 0.3, 0.6, 0.9].map((v) => Math.trunc(v * 0x7fff)),
        );
    });

    it("clips what is over full scale", () => {
        expect([...to16k(16000)(Float32Array.of(2, -2))]).toEqual([
            0x7fff, -0x8000,
        ]);
    });
});

describe("toolCall", () => {
    it("reads highlight's ids, go_to's one id, and zoom's id or change", () => {
        expect(toolCall("highlight", { ids: ["n1", 2, "n3"] })).toEqual({
            ids: ["n1", "n3"],
            act: "light",
        });
        expect(toolCall("go_to", { id: "n7" })).toEqual({
            ids: ["n7"],
            act: "go",
        });
        expect(toolCall("zoom", { id: "n7" })).toEqual({
            ids: ["n7"],
            act: "zoom",
        });
        expect(toolCall("zoom", { change: "out" })).toEqual({
            ids: [],
            act: "zoom",
            change: "out",
        });
        // "zoom back out to normal" came as both: the reset wins; in + id is into it
        expect(toolCall("zoom", { id: "n34", change: "reset" })).toEqual({
            ids: [],
            act: "zoom",
            change: "reset",
        });
        expect(toolCall("zoom", { id: "n34", change: "in" })).toEqual({
            ids: ["n34"],
            act: "zoom",
        });
    });

    it("points at nothing for anything else", () => {
        expect(toolCall("go_to", { id: 7 })).toEqual({ ids: [], act: "go" });
        expect(toolCall("highlight", "n1")).toEqual({ ids: [], act: "light" });
        expect(toolCall("zoom", { change: "max" })).toEqual({
            ids: [],
            act: "zoom",
        });
        expect(toolCall("scroll", { ids: ["n1"] })).toEqual({
            ids: [],
            act: "light",
        });
    });
});

describe("spoken (Gemini's transcript, without what it never says)", () => {
    it("keeps the words and drops markup, tool calls and silent turns", () => {
        expect(
            spoken(
                'Eligible shareholders get ¥1,000.<LMDX>### Benefit\n<List variant="clean"><ListTile>¥1,000</ListTile></List></LMDX><br>\n<br>\n',
            ),
        ).toBe("Eligible shareholders get ¥1,000.");
        expect(spoken("It is here <call:highlight{ids:[n68, n69")).toBe(
            "It is here",
        );
        expect(spoken("<no speech detected>")).toBe("");
        expect(spoken("Two < three, as the table says.")).toBe(
            "Two < three, as the table says.",
        );
    });
});

describe("functionResponse (Gemini)", () => {
    const fc = { id: "c1", name: "highlight" };
    const result = { shown: ["n1"], sources: ["n1"] };
    it("schedules beside the payload: SILENT to light, WHEN_IDLE to move", () => {
        expect(
            functionResponse(
                fc,
                toolCall("highlight", { ids: ["n1"] }),
                result,
                "gemini-3.8-live",
            ),
        ).toEqual({
            id: "c1",
            name: "highlight",
            response: result,
            scheduling: "SILENT",
        });
        expect(
            functionResponse(
                { id: "c2", name: "go_to" },
                toolCall("go_to", { id: "n1" }),
                result,
                "gemini-3.8-live",
            ).scheduling,
        ).toBe("WHEN_IDLE");
    });

    it("schedules nothing for Extended Thinking, which takes none", () => {
        const r = functionResponse(
            fc,
            toolCall("highlight", { ids: ["n1"] }),
            result,
            "gemini-3.8-live-extended-thinking",
        );
        expect(r).toEqual({ id: "c1", name: "highlight", response: result });
    });
});

describe("replyEnds (Gemini)", () => {
    it("ends on turnComplete", () => {
        expect(
            replyEnds({ serverContent: { turnComplete: true } }, false, false),
        ).toBe(true);
        expect(
            replyEnds(
                { serverContent: { outputTranscription: { text: "Hi" } } },
                true,
                false,
            ),
        ).toBe(false);
    });

    it("goes on past a filler while Extended Thinking works, and ends when it is idle", () => {
        const filler = {
            serverContent: {
                turnComplete: true,
                interactionStatus: "IN_PROGRESS",
            },
        };
        expect(replyEnds(filler, true, true)).toBe(false);
        expect(
            replyEnds(
                { toolCall: {}, interactionStatus: "IN_PROGRESS" },
                true,
                true,
            ),
        ).toBe(false);
        // a turnComplete without a status is an utterance too, not the reply's end
        expect(
            replyEnds({ serverContent: { turnComplete: true } }, true, true),
        ).toBe(false);
        expect(
            replyEnds(
                {
                    serverContent: {
                        turnComplete: true,
                        interactionStatus: "IDLE",
                    },
                },
                false,
                true,
            ),
        ).toBe(true);
        // idle on a message of its own: only a reply with words to close
        expect(replyEnds({ interactionStatus: "IDLE" }, true, true)).toBe(true);
        expect(replyEnds({ interactionStatus: "IDLE" }, false, true)).toBe(
            false,
        );
    });
});

/** a scripted Gemini session through startLive: fake mic, audio, backend and socket */
async function geminiTalk(model: string) {
    const sent: Record<string, unknown>[] = [];
    let sock!: {
        onopen: () => void;
        onmessage: (m: { data: string }) => Promise<void>;
        onclose: ((e: { code: number }) => void) | null;
    };
    class FakeSocket {
        static OPEN = 1;
        readyState = 1;
        onopen = () => {};
        onmessage = async (_m: { data: string }) => {};
        onclose: ((e: { code: number }) => void) | null = null;
        onerror = () => {};
        constructor() {
            sock = this;
        }
        send(d: string) {
            sent.push(JSON.parse(d));
        }
        close() {}
    }
    const node = () => ({ connect() {}, start() {}, stop() {}, onended: null });
    class FakeContext {
        sampleRate = 48000;
        currentTime = 0;
        destination = {};
        resume = async () => {};
        close = async () => {};
        createMediaStreamDestination = () => ({ stream: {} });
        createMediaStreamSource = node;
        createScriptProcessor = node;
        createGain = () => ({ ...node(), gain: { value: 1 } });
        createBufferSource = node;
        createBuffer = (_c: number, n: number, rate: number) => ({
            duration: n / rate,
            getChannelData: () => new Float32Array(n),
        });
    }
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal("AudioContext", FakeContext);
    vi.stubGlobal(
        "fetch",
        async () =>
            new Response(
                JSON.stringify({
                    context: "page",
                    image: false,
                    model,
                    token: "t",
                    ws: "wss://x",
                }),
            ),
    );
    Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
            getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        },
    });
    window.HTMLMediaElement.prototype.play = async () => {};
    const words: [string, string, string, boolean][] = [];
    const states: string[] = [];
    const handle = await startLive(
        "http://backend",
        "gemini",
        {
            captureId: "c1",
            sessionId: null,
            options: {},
            screenshot: false,
            signal: new AbortController().signal,
        },
        {
            onWords: (role, key, text, final) =>
                words.push([role, key, text, final]),
            onState: (s) => states.push(s),
            onPoint: () => ({ shown: ["n1"], sources: ["n1"] }),
            onEnd: () => {},
        },
    );
    sock.onopen();
    const say = (msg: object) => sock.onmessage({ data: JSON.stringify(msg) });
    await say({ setupComplete: {} });
    const last = (key: string) => words.filter((w) => w[1] === key).at(-1);
    return {
        handle,
        say,
        sent,
        states,
        last,
        activity: (type: string) => say({ voiceActivity: { type } }),
        heard: (text: string) =>
            say({ serverContent: { inputTranscription: { text } } }),
        spoke: (text: string) =>
            say({ serverContent: { outputTranscription: { text } } }),
    };
}

describe("a Gemini talk's turns", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("with barge-in off, a reply's end leaves the turn spoken after it open", async () => {
        const t = await geminiTalk("gemini-3.8-live");
        await t.activity("ACTIVITY_START");
        await t.heard("Question A");
        await t.activity("ACTIVITY_END");
        await t.activity("ACTIVITY_START"); // B, while A is still being answered
        await t.activity("ACTIVITY_END");
        await t.spoke("Answer A");
        await t.say({ serverContent: { turnComplete: true } });
        expect(t.last("g-user-1")?.[3]).toBe(true);
        expect(t.last("g-user-2")?.[3]).toBe(false);
        await t.heard("Question B"); // late words still reach B, still open
        expect(t.last("g-user-2")).toEqual([
            "user",
            "g-user-2",
            "Question B",
            false,
        ]);
        await t.spoke("Answer B");
        await t.say({ serverContent: { turnComplete: true } });
        expect(t.last("g-user-2")).toEqual([
            "user",
            "g-user-2",
            "Question B",
            true,
        ]);
        expect(t.last("g-model-0")).toEqual([
            "assistant",
            "g-model-0",
            "Answer A",
            true,
        ]);
        expect(t.last("g-model-1")).toEqual([
            "assistant",
            "g-model-1",
            "Answer B",
            true,
        ]);
    });

    it("stopping keeps the latest turn, though an earlier one is still being answered", async () => {
        const t = await geminiTalk("gemini-3.8-live");
        await t.activity("ACTIVITY_START");
        await t.heard("Question A");
        await t.activity("ACTIVITY_END");
        await t.activity("ACTIVITY_START");
        await t.heard("Question B");
        await t.spoke("Answer A so far");
        t.handle.stop();
        expect(t.last("g-user-2")).toEqual([
            "user",
            "g-user-2",
            "Question B",
            true,
        ]);
        expect(t.last("g-model-0")).toEqual([
            "assistant",
            "g-model-0",
            "Answer A so far",
            true,
        ]);
    });

    it("a reply cut by the user closes, and its late end does not close the new turn", async () => {
        const t = await geminiTalk("gemini-3.8-live");
        await t.activity("ACTIVITY_START");
        await t.activity("ACTIVITY_END");
        await t.spoke("Answer A and");
        await t.activity("ACTIVITY_START"); // B speaks over it
        await t.say({ serverContent: { interrupted: true } });
        expect(t.last("g-model-0")).toEqual([
            "assistant",
            "g-model-0",
            "Answer A and",
            true,
        ]);
        await t.say({ serverContent: { turnComplete: true } }); // A's own end
        await t.heard("Question B");
        expect(t.last("g-user-2")?.[3]).toBe(false);
        await t.activity("ACTIVITY_END");
        await t.spoke("Answer B");
        await t.say({ serverContent: { turnComplete: true } });
        expect(t.last("g-user-2")).toEqual([
            "user",
            "g-user-2",
            "Question B",
            true,
        ]);
        expect(t.last("g-model-1")).toEqual([
            "assistant",
            "g-model-1",
            "Answer B",
            true,
        ]);
    });

    it("Extended Thinking: filler and answer in one bubble, thinking between, no scheduling", async () => {
        const t = await geminiTalk("gemini-3.8-live-extended-thinking");
        await t.activity("ACTIVITY_START");
        await t.heard("What do shareholders get?");
        await t.activity("ACTIVITY_END");
        await t.spoke("Let me look.");
        await t.say({
            serverContent: {
                turnComplete: true,
                interactionStatus: "IN_PROGRESS",
            },
        });
        expect(t.last("g-model-0")?.[3]).toBe(false);
        expect(t.states.at(-1)).toBe("thinking");
        await t.say({
            toolCall: {
                functionCalls: [
                    { id: "c1", name: "highlight", args: { ids: ["n1"] } },
                ],
            },
            interactionStatus: "IN_PROGRESS",
        });
        const reply = t.sent.find((m) => "toolResponse" in m) as {
            toolResponse: { functionResponses: Record<string, unknown>[] };
        };
        expect(reply.toolResponse.functionResponses[0]).not.toHaveProperty(
            "scheduling",
        );
        await t.spoke("It is 1,000 yen.");
        await t.say({
            serverContent: { turnComplete: true, interactionStatus: "IDLE" },
        });
        expect(t.last("g-model-0")).toEqual([
            "assistant",
            "g-model-0",
            "Let me look. It is 1,000 yen.",
            true,
        ]);
        expect(t.last("g-user-1")?.[3]).toBe(true);
        expect(t.states.at(-1)).toBe("listening");
        // a second IDLE finds nothing open
        const n = t.states.length;
        await t.say({ interactionStatus: "IDLE" });
        expect(t.last("g-user-1")?.[3]).toBe(true);
        expect(t.states.length).toBeLessThanOrEqual(n + 1);
    });
});
