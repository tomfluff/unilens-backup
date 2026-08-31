/**
 * Teardown for embedders that remove accessibility at runtime.
 */
import { clearAppliedA11yDocument } from "./accessibilityStore";
import { destroyAccessibilityPanel } from "./accessibilityPanel";
import { destroyAutoTextSize } from "./autoTextSize";
import { destroyBodyTextExpand } from "./bodyTextExpand";
import { destroySelectionTextSize } from "./selectionTextSize";
// Read-aloud disabled — see accessibility-umd.ts init().
// import { destroySpeakSelection } from './speakSelection'
import { destroySmallTextBoost } from "./smallTextBoost";

/** Stops listeners, removes injected UI/styles, and clears document effects. Settings stay in localStorage. */
export function destroyAccessibilityRuntime() {
    destroyAccessibilityPanel();
    destroyAutoTextSize();
    destroyBodyTextExpand();
    destroySmallTextBoost();
    destroySelectionTextSize();
    // destroySpeakSelection()
    clearAppliedA11yDocument();
}
