# Project Architecture

Describes the overall directory structure and high-level architecture of the project:
```mermaid
flowchart TB
    subgraph Frontend_Targets["Frontend Test Targets (frontend/)"]
        direction TB
        Demo["dev-demo<br/>(Port 8001)"]
        SBMirror["softbank-mirror<br/>(Port 8000)"]
        SBRecruit["softbank-mirror-recruit<br/>(Port 8002 / 8787)"]
        HostPage["Host Web Page (DOM)"]
    end

    subgraph Client_Libs["Embeddable Client Libraries"]
        direction TB
        subgraph UniLensLib["unilens-lib (React + TypeScript)"]
            UL_Source["Sources: src/"]
            UL_Build["esbuild Bundle"]
            UL_Dist["dist/unilens.js<br/>window.UniLens"]
            UL_Source --> UL_Build --> UL_Dist
        end

        subgraph A11yLib["accessibility-lib (React + TypeScript)"]
            A11y_Source["Sources: src/"]
            A11y_Build["esbuild Bundle"]
            A11y_Dist["dist/accessibility.js<br/>window.Accessibility"]
            A11y_Source --> A11y_Build --> A11y_Dist
        end
    end

    subgraph Backend_App["Backend Service (backend/ - Flask)"]
        direction TB
        FlaskAPI["Flask API Server (app.py)<br/>Port 5000"]
        
        subgraph Endpoints["API Endpoints"]
            CapAPI["POST /api/capture"]
            ChatAPI["POST /api/chat (Stream/JSON)"]
            HealthAPI["GET /health"]
            HistAPI["GET /history"]
        end

        subgraph Storage["Local Storage"]
            CapStore[("captures/<id>/<br/>capture.png, meta.json")]
            SessStore[("sessions/<id>.json<br/>chat history & context")]
        end

        subgraph AI_Providers["AI / VLM Providers"]
            OpenAI["OpenAI API<br/>(gpt-5.4-mini)"]
            Gemini["Google Gemini API<br/>(gemini-3-flash-preview)"]
            Stub["Offline Echo Stub<br/>(Zero-config dev)"]
        end

        FlaskAPI --> Endpoints
        CapAPI --> CapStore
        ChatAPI --> SessStore
        ChatAPI --> AI_Providers
    end

    %% Build & Embedding Relationships
    UL_Dist -.->|"Embedded via &lt;script&gt;"| HostPage
    A11y_Dist -.->|"Embedded via &lt;script&gt;"| HostPage
    Demo -.-> HostPage
    SBMirror -.-> HostPage
    SBRecruit -.-> HostPage

    %% Runtime Communication
    HostPage --"1. Alt+Click / Drag Capture<br/>(PNG + Viewport + Meta)"--> CapAPI
    HostPage --"2. Multi-turn AI Chat / Voice Query"--> ChatAPI
```

# Unilens Architecture

Describes the implementation architecture of the unilens library:
```mermaid
flowchart TB
    subgraph Host_Environment["Host Page Context"]
        DOM["Host Document DOM"]
        UserInteractions["User Actions:<br/>• Alt+Click (inspect element)<br/>• Alt+Drag (region select)<br/>• Ctrl+Wheel (magnifier zoom)<br/>• Mouse move (trace history)"]
    end

    subgraph UniLens_Core["UniLens Runtime (unilens-lib)"]
        direction TB
        
        subgraph EntryLifecycle["Entry & Lifecycle (main.tsx)"]
            Init["UniLens.init(options)"]
            MountRoot["Mount Root container<br/>(#unilens-root in documentElement)"]
            SessionMgr["Session Continuity Manager"]
            Init --> MountRoot
            Init --> SessionMgr
        end

        subgraph VisualInteraction["Visual & Navigation Engines"]
            Tracer["Mouse Tracer<br/>(capture.ts)"]
            Hint["Dwell Hint Chip<br/>(hint.ts)"]
            ZoomEngine["Zoom / Magnifier Engine<br/>(zoom.ts)"]
            Minimap["Minimap Indicator<br/>(minimap.ts)"]
            PanEngines["Pan Engines:<br/>• Document Scroll<br/>• Frozen lensPan"]
            
            ZoomEngine --> PanEngines
            ZoomEngine --> Minimap
        end

        subgraph CapturePipeline["Capture & Context Pipeline (capture.ts)"]
            H2C["html2canvas<br/>Full-page render"]
            Annotate["Canvas Annotation:<br/>• Cyan Viewport Box<br/>• Fading Orange Mouse Trace<br/>• Red Click Crosshair<br/>• Magenta Region Box"]
            ElementInspect["Element Inspector (describeElement):<br/>Tag, text, class, role, path, nearest heading"]
            ViewportCrop["Zoom-aware Viewport Crop"]
            MetaPack["Package CaptureMeta & Images"]
            
            H2C --> Annotate --> MetaPack
            ElementInspect --> MetaPack
            ViewportCrop --> MetaPack
        end

        subgraph PopoverUI["Popover & Conversation UI (ChatPopover.tsx)"]
            ChatUI["Chat Interface<br/>(Draggable / Pinnable)"]
            MarkdownRender["Lightweight Markdown (mdLite)"]
            VoiceEngine["Voice Engine (speech.ts):<br/>• Web Speech STT (Listen)<br/>• SpeechSynthesis TTS (Speak)"]
            SettingsStore["Settings Store (settings.ts & SettingsPanel.tsx):<br/>• High Contrast / WCAG<br/>• Font Scaling<br/>• Trace / Continuity Toggles"]
            DebugPanel["Debug Panel (DebugPanel.tsx)"]

            ChatUI --> MarkdownRender
            ChatUI --> VoiceEngine
            ChatUI --> SettingsStore
            ChatUI --> DebugPanel
        end
    end

    subgraph Backend_Comms["Backend Service"]
        BackendCap["/api/capture"]
        BackendChat["/api/chat (SSE Stream)"]
    end

    %% Event Connections
    UserInteractions --> VisualInteraction
    UserInteractions --> CapturePipeline
    VisualInteraction -.-> DOM

    %% Capture Flow
    CapturePipeline -->|"Upload Capture"| BackendCap
    BackendCap -->|"capture_id"| EntryLifecycle
    EntryLifecycle -->|"Open Popover"| PopoverUI

    %% Chat Flow
    PopoverUI <-->|"Stream Questions & Answers"| BackendChat
```