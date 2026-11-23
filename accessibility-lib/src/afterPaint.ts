/**
 * Run work after the browser has painted the current frame.
 *
 * Panel clicks change a setting and then walk the host page (text size,
 * themed surfaces). Doing that walk inside the click handler holds back the
 * paint of the pressed button until the walk ends, so the panel feels laggy.
 * `afterNextPaint` lets the html-level switch and the panel repaint first.
 *
 * requestAnimationFrame callbacks run just before a paint, so the work is
 * pushed one task further with a timeout. Without rAF (tests, non-browser)
 * only the timeout is used.
 */

export interface AfterPaintTask {
    /** Queue the task; calls made while it is already queued coalesce. */
    schedule(): void;
    /** Drop the queued run, if any. */
    cancel(): void;
    /** Run now if queued (no-op otherwise). */
    flush(): void;
    readonly pending: boolean;
}

export function afterNextPaint(run: () => void): AfterPaintTask {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let queued = false;

    const fire = () => {
        raf = 0;
        timer = undefined;
        if (!queued) return;
        queued = false;
        run();
    };

    return {
        schedule() {
            if (queued) return;
            queued = true;
            if (typeof requestAnimationFrame === "function") {
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    timer = setTimeout(fire, 0);
                });
            } else {
                timer = setTimeout(fire, 0);
            }
        },
        cancel() {
            queued = false;
            if (raf && typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(raf);
            }
            if (timer !== undefined) clearTimeout(timer);
            raf = 0;
            timer = undefined;
        },
        flush() {
            if (!queued) return;
            this.cancel();
            run();
        },
        get pending() {
            return queued;
        },
    };
}
