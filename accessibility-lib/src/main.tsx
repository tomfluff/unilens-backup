/**
 * Accessibility embeddable entry.
 *
 * Embed build (dist/accessibility.js) exposes window.Accessibility:
 *   <script src="accessibility.js"></script>
 *   <script>Accessibility.init()</script>
 *
 * UniLensA11y is also exposed for compatibility with the previous UMD build.
 */
import UniLensA11y, {
    init as initA11y,
    destroy as destroyA11y,
    FEATURES,
} from "./accessibility-umd";
import type { UniLensA11yInitOptions } from "./accessibility-umd";

export type InitOptions = UniLensA11yInitOptions;

export function init(options: InitOptions = {}) {
    return initA11y(options);
}

export function destroy() {
    return destroyA11y();
}

const Accessibility = Object.assign({}, UniLensA11y, { init, destroy });

export { FEATURES, Accessibility, UniLensA11y };
export default Accessibility;

// Expose for plain <script> embeds
declare global {
    interface Window {
        Accessibility: typeof Accessibility;
    }
}
window.Accessibility = Accessibility;
window.UniLensA11y = Accessibility;
