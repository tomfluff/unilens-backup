/**
 * UniLens's panels live in the host page's light DOM, so a host reset reaches them:
 * `button, input, select { appearance: none }` hides the checkboxes and the selects'
 * arrows, and `summary { display: block }` hides the section markers (the recruit
 * mirror's common.css). Inside a [data-unilens-reset] root every element goes back to
 * the browser's defaults first (0,0,2 beats the host's element rules), and the
 * panels' own styled rules (one class, 0,1,0) still win over it. The chat has its
 * own reset (chatStyles.ts). `hidden` is left alone: Chrome applies it as a page
 * style, which the revert would undo (a hidden file input showed). Not
 * [data-unilens-ui]: the accessibility widget counter-inverts those, and these roots'
 * panels are counter-inverted already.
 */
const CSS =
    ":where([data-unilens-reset]) *:not(svg):not(svg *):where(:not([hidden])) { all: revert; }";

let injected: HTMLStyleElement | null = null;

/** marks `root` as UniLens UI and makes sure the reset is on the page */
export function resetHostStyles(root: HTMLElement) {
    root.dataset.unilensReset = "";
    if (injected?.isConnected) return;
    injected = document.createElement("style");
    injected.dataset.unilens = "ui-reset";
    injected.textContent = CSS;
    document.head.appendChild(injected);
}
