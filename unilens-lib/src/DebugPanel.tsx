/**
 * UniLens debug view — live instrumentation panel. Shows what UniLens sees
 * right now: pointer trace map, dwell-detector state, zoom state, last capture
 * timings/sizes, session, and backend health. Toggle via settings or
 * ctrl+shift+D. Mounted on documentElement: outside the zoom transform and
 * excluded from captures (html2canvas renders body only).
 *
 * Chart conventions follow the product's annotation semantics — color follows
 * the entity: trace orange, viewport/accent cyan, region magenta, ok green.
 *
 * The trace canvas stays imperative (per-frame 2D drawing inside an effect);
 * everything textual is derived state re-read on a 250ms tick.
 */
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { getSettings, updateSetting, useSettings } from "./settings";
import { getCaptureDebug, getTraceDebug } from "./capture";
import { getDwellDebug } from "./hint";
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

const rowStyle: CSSProperties = {
    font: "11px monospace",
    color: "#cdE",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
};

function Section({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <>
            <div
                style={{
                    color: CYAN,
                    font: "700 11px sans-serif",
                    margin: "10px 0 4px",
                    letterSpacing: 0.5,
                }}
            >
                {title.toUpperCase()}
            </div>
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
    const ctx = canvas.getContext("2d")!;
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

function DebugPanel({ sources }: { sources: DebugSources }) {
    // 250ms tick: all text below re-reads the live getters on each render
    const [, bump] = useState(0);
    const [health, setHealth] = useState("checking…");
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    return (
        <div
            style={{
                position: "fixed",
                top: 12,
                right: 12,
                width: 292,
                maxHeight: "94vh",
                overflowY: "auto",
                background: "rgba(13, 13, 26, 0.96)",
                border: "1px solid #2a2a4a",
                borderRadius: 10,
                padding: "10px 14px 14px",
                zIndex: 2147483647,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span style={{ color: CYAN, font: "700 13px sans-serif" }}>
                    UniLens debug
                </span>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#889",
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                    onClick={() => updateSetting("debugView", false)}
                >
                    ✕
                </button>
            </div>

            <Section title="Pointer trace">
                <canvas
                    ref={canvasRef}
                    width={264}
                    height={66}
                    style={{
                        borderRadius: 6,
                        background: "#101020",
                        display: "block",
                    }}
                />
                <div style={rowStyle}>
                    {last
                        ? `content (${Math.round(last.x)}, ${Math.round(last.y)}) · ${t.window.length} pts in ${t.windowSec}s window · buffer ${t.buffer}`
                        : `no recent movement · buffer ${t.buffer}`}
                </div>
            </Section>

            <Section title="Dwell detector">
                <div
                    style={{
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        height: 8,
                        margin: "2px 0 4px",
                    }}
                >
                    <div
                        style={{
                            background: d.blocked ? DIM : GREEN,
                            borderRadius: 4,
                            height: 8,
                            width: `${Math.round(d.progress * 100)}%`,
                        }}
                    />
                </div>
                <div style={rowStyle}>
                    {(d.blocked
                        ? `blocked: ${d.blocked}`
                        : `progress ${Math.round(d.progress * 100)}%`) +
                        ` · ${d.ptsInWindow} pts · spread ${d.spreadPx}px` +
                        `\nwindow ${d.windowMs / 1000}s${d.zoomSignal ? " (zoom signal)" : ""}` +
                        (d.cooldownMs > 0
                            ? ` · cooldown ${fmtAge(d.cooldownMs)}`
                            : "") +
                        (d.chipVisible ? " · CHIP VISIBLE" : "")}
                </div>
            </Section>

            <Section title="Zoom">
                <div style={rowStyle}>
                    {`scale ${z.scale.toFixed(2)} → target ${getTargetZoom().toFixed(2)} · layout ${z.layoutW}×${z.layoutH}` +
                        `\nzoomTrace ${zt.length} events (30s)` +
                        (zt.length
                            ? ` · last ${zt[zt.length - 1].scale}x @ (${zt[zt.length - 1].x}, ${zt[zt.length - 1].y})`
                            : "")}
                </div>
            </Section>

            <Section title="Last capture">
                <div style={rowStyle}>
                    {c
                        ? `${c.id ?? "(not uploaded)"} · ${fmtAge(Date.now() - c.at)} ago` +
                          `\npre ${c.timings.preprocess} + render ${c.timings.render} + enc ${c.timings.encode} = ${c.timings.total}ms` +
                          `\n${c.pageW}×${c.pageH} · ${c.images} image${c.images === 1 ? "" : "s"} · ${c.sizes.pageKB}KB + ${c.sizes.closeupKB}KB`
                        : "none yet"}
                </div>
            </Section>

            <Section title="Session">
                <div style={rowStyle}>
                    {`${sources.sessionId() ?? "(none — next capture starts one)"} · popover ${
                        sources.popoverOpen() ? "open" : "closed"
                    }`}
                </div>
            </Section>

            <Section title="Backend">
                <div
                    style={rowStyle}
                >{`${sources.backend() || "(same origin)"}\n${health}`}</div>
            </Section>
        </div>
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
