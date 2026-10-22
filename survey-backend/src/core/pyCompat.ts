/**
 * Python's formatting where the Flask backend's output depends on it: the JSON a
 * log line is written as (and measured by), str() in a CSV cell, round() and
 * "{:.1f}". The survey's logs and CSV were defined by backend/app.py; matching
 * it byte for byte lets the two backends read each other's logs and lets their
 * results be compared during the move.
 *
 * Ceiling: JSON.parse forgets whether a number was written 1 or 1.0, and loses
 * integers past 2^53, so those print as Python would print an int. quiz-lib
 * only sends integers, so this never shows in practice.
 */

/** Python's float repr for a non-integer: the shortest digits, in exponent form below 1e-4 or from 1e16. */
function floatRepr(x: number): string {
    const [mantissa, exp] = x.toExponential().split("e");
    const e = Number(exp);
    if (e >= -4 && e < 16) return String(x);
    return `${mantissa}e${e < 0 ? "-" : "+"}${String(Math.abs(e)).padStart(2, "0")}`;
}

/** A JSON number as Python prints it (see the ceiling above). */
export function pyNumber(x: number): string {
    if (Number.isNaN(x)) return "NaN";
    if (!Number.isFinite(x)) return x > 0 ? "Infinity" : "-Infinity";
    if (Number.isInteger(x)) return BigInt(x).toString();
    return floatRepr(x);
}

/**
 * json.dumps(value, ensure_ascii=False): ", " and ": " between items, strings
 * escaped as JSON.stringify does (the same set as Python's).
 */
export function pyDumps(value: unknown): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return pyNumber(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(pyDumps).join(", ")}]`;
    const entries = Object.entries(value as Record<string, unknown>);
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}: ${pyDumps(v)}`).join(", ")}}`;
}

/** len() of a Python string: code points, not UTF-16 units (an emoji is 1, not 2). */
export function pyLen(s: string): number {
    let n = 0;
    for (const _ of s) n++;
    return n;
}

/** repr() of a string: single quotes unless it holds one and no double quote. */
function strRepr(s: string): string {
    const q = s.includes("'") && !s.includes('"') ? '"' : "'";
    let out = "";
    for (const ch of s) {
        if (ch === q || ch === "\\") out += `\\${ch}`;
        else if (ch === "\n") out += "\\n";
        else if (ch === "\r") out += "\\r";
        else if (ch === "\t") out += "\\t";
        else if (ch < " " || ch === "\x7f")
            out += `\\x${ch.charCodeAt(0).toString(16).padStart(2, "0")}`;
        else out += ch;
    }
    return `${q}${out}${q}`;
}

function pyRepr(value: unknown): string {
    return typeof value === "string" ? strRepr(value) : pyStr(value);
}

/** str(value) for a value parsed from JSON: None, True, ['a', 'c'], {'k': 1}. */
export function pyStr(value: unknown): string {
    if (value === null || value === undefined) return "None";
    if (typeof value === "boolean") return value ? "True" : "False";
    if (typeof value === "number") {
        if (Number.isNaN(value)) return "nan";
        if (!Number.isFinite(value)) return value > 0 ? "inf" : "-inf";
        return pyNumber(value);
    }
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;
    const entries = Object.entries(value as Record<string, unknown>);
    return `{${entries.map(([k, v]) => `${strRepr(k)}: ${pyRepr(v)}`).join(", ")}}`;
}

/** Python's truthiness, for a value parsed from JSON. */
export function pyTruthy(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (value !== null && typeof value === "object")
        return Object.keys(value).length > 0;
    return Boolean(value);
}

/** round(x): halves go to the even neighbour (round(2.5) == 2). */
export function pyRound(x: number): number {
    const r = Math.round(x);
    return Math.abs(x % 1) === 0.5 ? 2 * Math.round(x / 2) : r;
}

/**
 * f"{x:.1f}": rounds the exact binary value, halves to even — 0.25 gives
 * "0.2" where toFixed(1) gives "0.3".
 */
export function pyFixed1(x: number): string {
    if (x < 0 || Object.is(x, -0)) return `-${pyFixed1(-x)}`;
    if (!Number.isFinite(x)) return Number.isNaN(x) ? "nan" : "inf";
    if (Number.isInteger(x)) return `${BigInt(x)}.0`;
    // toFixed(100) is the exact decimal expansion of x for any value a time can have
    const [whole, frac] = x.toFixed(100).split(".");
    const tenths = BigInt(whole + frac[0]);
    const rest = frac.slice(1);
    const half = "5".padEnd(rest.length, "0");
    const up = rest > half || (rest === half && tenths % 2n === 1n);
    const n = (up ? tenths + 1n : tenths).toString().padStart(2, "0");
    return `${n.slice(0, -1)}.${n.slice(-1)}`;
}
