/**
 * UniLens debug view — live instrumentation panel. Shows what was sent to the
 * model (every capture's full annotated page and close-up, its meta, and the
 * questions asked against it) and what UniLens sees right now: pointer trace
 * map, dwell-detector state, zoom state, last capture timings/sizes, session,
 * and backend health. Developer-facing: the chat window shows the conversation
 * only. Toggle via settings or ctrl+shift+D; drag the header to move it, fold
 * it with the arrow. Mounted on documentElement: outside the zoom transform and
 * excluded from captures (html2canvas renders body only).
 *
 * Chart conventions follow the product's annotation semantics — color follows
 * the entity: trace orange, viewport/accent cyan, region magenta, ok green.
 *
 * The trace canvas stays imperative (per-frame 2D drawing inside an effect);
 * everything textual is derived state re-read on a 250ms tick.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import type { CaptureMeta } from "./capture";
import {
    getCaptureDebug,
    getLastInventoryDebug,
    getTraceDebug,
} from "./capture";
import { getLastEvidenceDebug } from "./evidence";
import { getDwellDebug } from "./hint";
import { getSentLog, type SentCapture } from "./sentLog";
import { getSettings, updateSetting, useSettings } from "./settings";
import { getTargetZoom, getView, getZoom, getZoomTrace } from "./zoom";

export interface DebugSources {
    sessionId: () => string | null;
    popoverOpen: () => boolean;
    backend: () => string;
}

const ORANGE = "#ffb400";
const CYAN = "#00c8ff";
const GREEN = "#4cff91";
const DIM = "#8899aa";

const PanelContainer = styled.div`
    position: fixed;
    width: 292px;
    max-height: 94vh;
    overflow-y: auto;
    background: rgba(13, 13, 26, 0.96);
    border: 1px solid #2a2a4a;
    border-radius: 10px;
    padding: 10px 14px 14px;
    z-index: 2147483647;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    cursor: grab;
    touch-action: none;
    user-select: none;
`;

// explicit sizes: the panel lives in the host page's light DOM, where a rule like
// \`img { height: 260px }\` would otherwise reach these thumbnails
const Thumbs = styled.div`
    display: flex;
    gap: 6px;
    align-items: flex-start;
    margin: 4px 0;
    & img {
        display: block;
        width: 124px;
        height: auto;
        max-height: 160px;
        object-fit: contain;
        object-position: top;
        border: 1px solid #2a2a4a;
        border-radius: 4px;
        background: #fff;
    }
`;

const Entry = styled.details`
    border-top: 1px solid #2a2a4a;
    padding: 4px 0;
    & > summary {
        cursor: pointer;
        font: 11px monospace;
        color: #cde;
    }
`;

const PanelLink = styled.a`
    color: ${CYAN};
    font: 11px monospace;
`;

const HeaderTitle = styled.span`
    color: ${CYAN};
    font: 700 13px sans-serif;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #889;
    cursor: pointer;
    font-size: 14px;
`;

const SectionTitle = styled.div`
    color: ${CYAN};
    font: 700 11px sans-serif;
    margin: 10px 0 4px;
    letter-spacing: 0.5px;
`;

const RowText = styled.div`
    font: 11px monospace;
    color: #cde;
    line-height: 1.6;
    white-space: pre-wrap;
`;

const TraceCanvas = styled.canvas`
    border-radius: 6px;
    background: #101020;
    display: block;
`;

const ProgressBar = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    height: 8px;
    margin: 2px 0 4px;
`;

const ProgressFill = styled.div<{ progress: number; blocked: string }>`
    background: ${(props) => (props.blocked ? DIM : GREEN)};
    border-radius: 4px;
    height: 8px;
    width: ${(props) => Math.round(props.progress * 100)}%;
`;

function Section({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <>
            <SectionTitle>{title.toUpperCase()}</SectionTitle>
            {children}
        </>
    );
}

function fmtAge(ms: number): string {
    return ms < 1000
        ? `${ms}ms`
        : ms < 60_000
          ? `${(ms / 1000).toFixed(1)}s`
          : `${Math.round(ms / 60_000)}m`;
}

function drawTrace(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const { window: pts } = getTraceDebug();
    const z = getZoom();
    // content coords → viewport-proportional canvas coords
    const v = getView();
    const sx = (x: number) => ((x * z.scale - v.x) / window.innerWidth) * W;
    const sy = (y: number) => ((y * z.scale - v.y) / window.innerHeight) * H;

    if (pts.length >= 2) {
        const oldest = pts[0].t;
        const span = Math.max(pts[pts.length - 1].t - oldest, 1);
        for (let i = 1; i < pts.length; i++) {
            const age = (pts[i].t - oldest) / span;
            ctx.beginPath();
            ctx.moveTo(sx(pts[i - 1].x), sy(pts[i - 1].y));
            ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
            ctx.strokeStyle = ORANGE;
            ctx.globalAlpha = 0.15 + age * 0.85;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const last = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(sx(last.x), sy(last.y), 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }

    // dwell zone: centroid + radius, in client space
    const d = getDwellDebug();
    if (d.centroid) {
        ctx.beginPath();
        ctx.ellipse(
            (d.centroid.x / window.innerWidth) * W,
            (d.centroid.y / window.innerHeight) * H,
            (80 / window.innerWidth) * W,
            (80 / window.innerHeight) * H,
            0,
            0,
            Math.PI * 2,
        );
        ctx.strokeStyle = GREEN;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }
}

/** one line of what the capture's meta told the model */
function metaLine(m: CaptureMeta): string {
    const el = m.element;
    return (
        `click (${m.clickX}, ${m.clickY}) · scroll ${m.scrollDepth}% · ${m.trace.length} trace pts` +
        (m.zoom !== 1 ? ` · zoom ${Math.round(m.zoom * 100)}%` : "") +
        (m.region ? ` · region ${m.region.w}×${m.region.h}` : "") +
        (el
            ? `\nclicked <${el.tag}>` +
              (el.text
                  ? ` "${el.text.slice(0, 60)}${el.text.length > 60 ? "…" : ""}"`
                  : "") +
              (el.nearestHeading ? ` under "${el.nearestHeading}"` : "")
            : "")
    );
}

/** what the backend says it stored for a capture, fetched once per id */
const storedCache = new Map<string, string>();
function useStored(backend: string, id: string): string {
    const [text, setText] = useState(storedCache.get(id) ?? "");
    useEffect(() => {
        if (storedCache.has(id)) return;
        if (id === "local") {
            storedCache.set(id, "not uploaded: backend unreachable");
            setText(storedCache.get(id) ?? "");
            return;
        }
        fetch(`${backend}/api/capture/${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((d) => {
                const f = d.files ?? {};
                const kb = (n: string) =>
                    f[n] != null ? `✓ ${Math.round(f[n] / 1024)}KB` : "✗";
                storedCache.set(
                    id,
                    `stored: page ${kb("capture.png")} · close-up ${kb("viewport.png")} · inventory ${kb("inventory.json")}`,
                );
            })
            .catch(() => storedCache.set(id, "stored: (check failed)"))
            .finally(() => setText(storedCache.get(id) ?? ""));
    }, [backend, id]);
    return text;
}

function SentEntry({
    c,
    backend,
    newest,
}: {
    c: SentCapture;
    backend: string;
    newest: boolean;
}) {
    const stored = useStored(backend, c.id);
    const url = (kind: "image" | "viewport") =>
        c.id === "local"
            ? undefined
            : `${backend}/api/capture/${encodeURIComponent(c.id)}/${kind}`;
    const inv = c.cap.inventory;
    return (
        <Entry open={newest}>
            <summary>
                {`${new Date(c.at).toLocaleTimeString()} · ${c.id.slice(0, 8)}` +
                    (c.viewRefresh ? " · view refresh" : "") +
                    ` · ${c.asks.length} asked`}
            </summary>
            <Thumbs>
                <a href={url("image")} target="_blank" rel="noreferrer">
                    <img src={c.cap.image} alt="full annotated page sent" />
                </a>
                {c.cap.viewportImage && (
                    <a href={url("viewport")} target="_blank" rel="noreferrer">
                        <img
                            src={c.cap.viewportImage}
                            alt="close-up of the view sent"
                        />
                    </a>
                )}
            </Thumbs>
            <RowText>
                {metaLine(c.cap.meta) +
                    `\ninventory ${inv ? `${inv.length} nodes · ${Math.round((c.cap.meta.inventoryBytes ?? 0) / 1024)}KB · ${c.cap.meta.inventoryTruncated ?? 0} dropped` : "none"}` +
                    (stored ? `\n${stored}` : "")}
            </RowText>
            {c.asks.map((a) => (
                <RowText key={a.at} style={{ marginTop: 4 }}>
                    {`“${a.question}” · cite ${a.cite ? "on" : "off"}` +
                        (a.reply
                            ? `\n→ ${a.reply.provider} · ${a.reply.model} · ${a.reply.imagesSent} image${a.reply.imagesSent === 1 ? "" : "s"} · ${(a.reply.latencyMs / 1000).toFixed(1)}s`
                            : "") +
                        (a.cited?.length
                            ? ` · cited ${a.cited.join(", ")}`
                            : "") +
                        (a.error ? `\n→ error: ${a.error}` : "") +
                        (!a.reply && !a.error ? "\n→ waiting…" : "")}
                </RowText>
            ))}
        </Entry>
    );
}

type Pos = { left: number; top: number };
/** keep the header on screen so the panel can always be dragged back */
const clampPos = (p: Pos): Pos => ({
    left: Math.min(Math.max(p.left, 0), window.innerWidth - 80),
    top: Math.min(Math.max(p.top, 0), window.innerHeight - 32),
});
/** a stored position is only used when both coordinates are finite */
const validPos = (p: unknown): Pos | null =>
    p &&
    typeof p === "object" &&
    Number.isFinite((p as Pos).left) &&
    Number.isFinite((p as Pos).top)
        ? clampPos(p as Pos)
        : null;

function DebugPanel({ sources }: { sources: DebugSources }) {
    // 250ms tick: all text below re-reads the live getters on each render
    const [, bump] = useState(0);
    const [health, setHealth] = useState("checking…");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stored = useSettings((st) => st.debugPanel);
    const collapsed = stored?.collapsed === true;
    const [pos, setPos] = useState<Pos | null>(() => validPos(stored?.pos));
    const drag = useRef<{ dx: number; dy: number } | null>(null);
    // the latest dragged position: a fast release can arrive before React commits it
    const lastPos = useRef<Pos | null>(pos);
    const saveLayout = (next: { pos?: Pos | null; collapsed?: boolean }) =>
        updateSetting("debugPanel", {
            pos: next.pos !== undefined ? next.pos : pos,
            collapsed: next.collapsed ?? collapsed,
        });

    function onHeaderDown(e: React.PointerEvent<HTMLDivElement>) {
        if ((e.target as HTMLElement).closest("button")) return;
        const r = e.currentTarget.parentElement?.getBoundingClientRect();
        if (!r) return;
        drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    function onHeaderMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!drag.current) return;
        lastPos.current = clampPos({
            left: e.clientX - drag.current.dx,
            top: e.clientY - drag.current.dy,
        });
        setPos(lastPos.current);
    }
    function onHeaderUp() {
        if (!drag.current) return;
        drag.current = null;
        saveLayout({ pos: lastPos.current }); // persisted once per drag, not per move
    }

    useEffect(() => {
        const timer = window.setInterval(() => bump((n) => n + 1), 250);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res = await fetch(`${sources.backend()}/health`);
                const d = await res.json();
                if (alive) setHealth(`${d.status} · provider ${d.provider}`);
            } catch {
                if (alive) setHealth("UNREACHABLE");
            }
        };
        poll();
        const timer = window.setInterval(poll, 5000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [sources]);

    useEffect(() => {
        if (canvasRef.current) drawTrace(canvasRef.current);
    });

    const t = getTraceDebug();
    const last = t.window[t.window.length - 1];
    const d = getDwellDebug();
    const z = getZoom();
    const zt = getZoomTrace(Date.now());
    const c = getCaptureDebug();
    const inv = getLastInventoryDebug();
    const ev = getLastEvidenceDebug();

    const sent = getSentLog();
    const backend = sources.backend();

    return (
        <PanelContainer
            style={
                pos ? { left: pos.left, top: pos.top } : { top: 12, right: 12 }
            }
        >
            <HeaderRow
                onPointerDown={onHeaderDown}
                onPointerMove={onHeaderMove}
                onPointerUp={onHeaderUp}
                title="Drag to move"
            >
                <HeaderTitle>UniLens debug</HeaderTitle>
                <span>
                    <CloseButton
                        type="button"
                        aria-expanded={!collapsed}
                        aria-label={
                            collapsed
                                ? "Expand debug panel"
                                : "Collapse debug panel"
                        }
                        onClick={() => saveLayout({ collapsed: !collapsed })}
                    >
                        {collapsed ? "▸" : "▾"}
                    </CloseButton>
                    <CloseButton
                        type="button"
                        aria-label="Close debug panel"
                        onClick={() => updateSetting("debugView", false)}
                    >
                        ✕
                    </CloseButton>
                </span>
            </HeaderRow>
            {!collapsed && (
                <>
                    <Section title="Sent to the model">
                        {sent.length ? (
                            sent.map((c, i) => (
                                <SentEntry
                                    key={`${c.id}-${c.at}`}
                                    c={c}
                                    backend={backend}
                                    newest={i === 0}
                                />
                            ))
                        ) : (
                            <RowText>nothing yet: alt+click to capture</RowText>
                        )}
                        <RowText style={{ marginTop: 4 }}>
                            <PanelLink
                                href={`${backend}/history`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                older sessions: backend history
                            </PanelLink>
                        </RowText>
                    </Section>

                    <Section title="Pointer trace">
                        <TraceCanvas ref={canvasRef} width={264} height={66} />
                        <RowText>
                            {last
                                ? `content (${Math.round(last.x)}, ${Math.round(last.y)}) · ${t.window.length} pts in ${t.windowSec}s window · buffer ${t.buffer}`
                                : `no recent movement · buffer ${t.buffer}`}
                        </RowText>
                    </Section>

                    <Section title="Dwell detector">
                        <ProgressBar>
                            <ProgressFill
                                progress={d.progress}
                                blocked={d.blocked}
                            />
                        </ProgressBar>
                        <RowText>
                            {(d.blocked
                                ? `blocked: ${d.blocked}`
                                : `progress ${Math.round(d.progress * 100)}%`) +
                                ` · ${d.ptsInWindow} pts · spread ${d.spreadPx}px` +
                                `\nwindow ${d.windowMs / 1000}s${d.zoomSignal ? " (zoom signal)" : ""}` +
                                (d.cooldownMs > 0
                                    ? ` · cooldown ${fmtAge(d.cooldownMs)}`
                                    : "") +
                                (d.chipVisible ? " · CHIP VISIBLE" : "")}
                        </RowText>
                    </Section>

                    <Section title="Zoom">
                        <RowText>
                            {`scale ${z.scale.toFixed(2)} → target ${getTargetZoom().toFixed(2)} · layout ${z.layoutW}×${z.layoutH}` +
                                `\nzoomTrace ${zt.length} events (30s)` +
                                (zt.length
                                    ? ` · last ${zt[zt.length - 1].scale}x @ (${zt[zt.length - 1].x}, ${zt[zt.length - 1].y})`
                                    : "")}
                        </RowText>
                    </Section>

                    <Section title="Last capture">
                        <RowText>
                            {c
                                ? `${c.id ?? "(not uploaded)"} · ${fmtAge(Date.now() - c.at)} ago` +
                                  `\npre ${c.timings.preprocess} + render ${c.timings.render} + enc ${c.timings.encode} = ${c.timings.total}ms` +
                                  `\n${c.pageW}×${c.pageH} · ${c.images} image${c.images === 1 ? "" : "s"} · ${c.sizes.pageKB}KB + ${c.sizes.closeupKB}KB`
                                : "none yet"}
                        </RowText>
                    </Section>

                    {/* ~4 bytes per token is the usual English/JSON rule of thumb; a readout, not a budget */}
                    <Section title="Inventory">
                        <RowText>
                            {(inv
                                ? `${inv.nodes} nodes · ${Math.round(inv.bytes / 1024)}KB · ~${Math.round(inv.bytes / 4)} tokens · ${inv.truncated} dropped`
                                : "none yet") +
                                (() => {
                                    const st = getSettings();
                                    return `\nhighlight ${st.hlOutline} · ${st.hlBackdrop}${st.hlFill ? " · fill" : ""}${st.hlGlow ? " · glow" : ""}${st.hlBadges ? " · badges" : ""} · ${st.hlColor} · cue ${st.offscreenCue}`;
                                })()}
                        </RowText>
                    </Section>

                    <Section title="Last answer's evidence">
                        <RowText>
                            {ev
                                ? `${ev.ids.length} cited · ${ev.dropped} unknown id${ev.dropped === 1 ? "" : "s"} dropped · ${fmtAge(Date.now() - ev.at)} ago` +
                                  ev.ids
                                      .map(
                                          (id, i) =>
                                              `\n${i + 1}. ${id}: ${ev.labels[i]}`,
                                      )
                                      .join("")
                                : "none yet"}
                        </RowText>
                    </Section>

                    <Section title="Session">
                        <RowText>
                            {`${sources.sessionId() ?? "(none — next capture starts one)"} · popover ${
                                sources.popoverOpen() ? "open" : "closed"
                            }`}
                        </RowText>
                    </Section>

                    <Section title="Backend">
                        <RowText>
                            {`${sources.backend() || "(same origin)"}\n${health}`}
                        </RowText>
                    </Section>
                </>
            )}
        </PanelContainer>
    );
}

/** renders the panel only while settings.debugView is on */
function DebugGate({ sources }: { sources: DebugSources }) {
    const debugView = useSettings((s) => s.debugView);
    return debugView ? <DebugPanel sources={sources} /> : null;
}

export function initDebug(sources: DebugSources) {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
            e.preventDefault();
            updateSetting("debugView", !getSettings().debugView);
        }
    });

    const container = document.createElement("div");
    container.id = "unilens-debug-root";
    document.documentElement.appendChild(container);
    createRoot(container).render(<DebugGate sources={sources} />);
}
