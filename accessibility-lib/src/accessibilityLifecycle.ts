/**
 * Teardown for embedders that remove accessibility at runtime.
 */

import { destroyAccessibilityPanel } from "./accessibilityPanel";
import { clearAppliedA11yDocument } from "./accessibilityStore";
import { destroyAutoTextSize } from "./autoTextSize";
import { destroyBodyTextExpand } from "./bodyTextExpand";
// Read-aloud disabled — see accessibility-umd.ts init().
// import { destroySpeakSelection } from './speakSelection'
import { destroyCursorHalo } from "./cursorHalo";
import { destroyFocusCursorMask } from "./focusCursorMask";
import { destroyReadingGuide } from "./readingGuide";
import { destroySelectionTextSize } from "./selectionTextSize";
import { destroySmallTextBoost } from "./smallTextBoost";

/** Stops listeners, removes injected UI/styles, and clears document effects. Settings stay in localStorage. */
export function destroyAccessibilityRuntime() {
    destroyAccessibilityPanel();
    destroyAutoTextSize();
    destroyBodyTextExpand();
    destroySmallTextBoost();
    destroyCursorHalo();
    destroyFocusCursorMask();
    destroyReadingGuide();
    destroySelectionTextSize();
    // destroySpeakSelection()
    clearAppliedA11yDocument();
}
