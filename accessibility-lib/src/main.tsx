import { createRoot } from 'react-dom/client'

function TestJsx() {
    return <>{"Hello"}</>;
}


export function init() {
    const container = document.createElement('div');
    container.id = "accessibility-root";
    document.documentElement.appendChild(container);
    const root = createRoot(container);
    root?.render(<TestJsx />);
}

// Expose for plain <script> embeds
declare global {
    interface Window {
        Accessibility: { init: typeof init }
    }
}
window.Accessibility = { init }