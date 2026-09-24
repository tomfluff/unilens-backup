# Phase-1 research probes: what the literature settles, and what stays a knob

Three questions, each answered independently by a Claude research agent and by
Codex (gpt-5.6-sol, web search), then reconciled. Where both agree the design
doc adopts it; where they differ and the evidence is silent, it is a knob.
Links marked ✅ were fetched by at least one reader; 🔍 seen in search results
only.

## 1. DOM inventory for a "where is X?" model

**Settled.**
- Region-level summaries are state of the art, not our bet: Region4Web merges
  accessibility-tree regions bottom-up and has a 0.6B model write each a
  purpose + state summary, attaching raw subtrees only for selected regions:
  −43% observation tokens *and* +1.7–3.0 pt WebArena success across four
  backbones (one established agent regressed). D2Snap is the weaker precedent
  (hierarchy merging + Markdown rollup; 73% vs 65%). Summaries are additive to
  literal text, never a replacement.
- Non-interactive text is essential for locate tasks: PageGuide indexes every
  visible text-bearing or interactive node; D2Snap keeps content as Markdown;
  AgentOccam folds static text into the interactive sibling sharing its label.
  "Complete flattening performed poorly" (D2Snap): hierarchy carries signal.
- Grounding channel: the textual candidate list selects; the screenshot is the
  second channel, not the index. Screenshot-only 1.9% vs marked text 61–67% vs
  downsampled DOM 73% (D2Snap, 52 states); SeeAct text choices 39–42% vs
  Set-of-Mark 14–24%. Hybrid helps GPT-4V and hurt Gemini-Pro (VisualWebArena)
  and was not significant in D2Snap: **screenshot on/off is a per-model
  runner column, not a global decision.**
- Ids: back them by node identity (BrowserGym `bid`, Region4Web's stable ids),
  not array position; clear the registry on capture failure rather than serve
  stale indices (browser-use).
- Prune: `script/style/template`, `aria-hidden`, `inert`, `display:none`,
  `visibility:hidden`, zero-area nodes. Keep rendered off-screen nodes with a
  visibility flag: "below the fold" is a correct answer to "where is X?" and
  cannot be given about a deleted node (our one deliberate divergence from
  action agents, justified by the task).
- Schema: role, accessible name, bbox, id earn their bytes; tag, class,
  selector and attribute dumps do not (A11y-Compressor: tag/name/position only,
  +5.1 pt OSWorld at 22% tokens). Short keys and integer boxes.
- Container criterion (Region4Web, take as published): a container earns a
  node if it is a landmark, heading, or labelled, or has ≥2 child branches each
  holding a visible descendant. Collapse unlabelled single-child chains.

**Said plainly:** UniLens's region summaries are the cheap client-side version
(region role, heading text, the names of emitted children), not Region4Web's
fine-tuned 0.6B summariser, and there is no on-page LLM. The evidence supports
the shape; the quality of *our* summaries is something the runner measures.
What nobody in this literature measures is whether a *human* found the element
the model named; that measurement, with low-vision magnifier users, is the
paper.

**Novel, if we do it:** a locate-specific, budgeted representation combining
persistent ids, full-page rendered text leaves, visibility geometry, additive
region summaries, evaluated with low-vision users. **Not novel:** AX role/name
extraction, SoM ids, candidate ranking, region summaries themselves.

**Consequence for the design doc:** node schema goes to short keys
(`i, r, n, b, v`, optional `t, s, p`); container rule replaced by Region4Web's;
budget guard drops nodes farthest from the viewport centre first and reports
the count; `summary` becomes an additive `t` on region nodes rather than a
per-depth rollup. Privacy rule (no field values or contents) unchanged.

## 2. The highlight itself

**Settled.**
- W3C Technique C40 ✅: two colour bands ≥9:1 apart guarantee one band reaches
  3:1 against any *solid* background; images and gradients still need a pixel
  check or an opaque backplate. SC 2.4.13 ✅: 2 CSS px perimeter, 3:1
  change-of-contrast (AAA; applies to keyboard focus, used here as the design
  floor). SC 1.4.11 ✅ 3:1 against adjacent colours. SC 2.2.2 ✅ anything
  blinking >5 s needs pause/stop/hide; SC 2.3.3 ✅ interaction motion must be
  disableable.
- Layer placement: a `transform` ancestor is the containing block for
  `position: fixed` descendants (MDN ✅), so the ring layer must be a sibling
  of the zoomed `<body>`, under `documentElement`. Screen pixels are the unit
  of perceivability.
- No dimming, no scrim: magnification already costs context (Tang et al.
  ASSETS 2023 ✅ DOI 10.1145/3597638.3608383); no study supports spotlight
  dimming for low vision.
- Forced colours: real strokes (`Canvas` inner, `CanvasText` outer), never
  `box-shadow` alone (CSS Color Adjust ✅, C40 ✅).
- Both readers: **no controlled low-vision evidence for outline width or
  zoom-scaling.** Measure target-acquisition time (highlight onset → pointer
  on the element) at 1× and 4×.

**Builder decision (2026-09-19): the highlight's visual design is part of the
research.** The findings above set the default preset and the floor; they do
not fix the design. `highlight.ts` renders from a parameter object with named
presets (ring, fill, glow, dim-others, pulse are composable), so yellow
fills, glows and dimming can be tried against the WCAG ring on the real
mirrors. Dimming and pulsing are off in the default preset for the reasons
cited here, and available as presets for exactly that comparison.

**Knobs (evidence silent).**
- `ringWidth`: default 2 px per band (4 total), constant in screen px
  (Codex); alternative `clamp(3px, 2px × zoom, 8px)` per band (Claude) via
  `ringScale`.
- `pulse`: default off (Codex, C39 ✅); optional bounded variant: opacity only
  1→0.35→1, two 600 ms cycles, then static; never translate or scale; off under
  `prefers-reduced-motion`.
- `minimapMarker`: 16 × 16 screen px fill with a 2 px contrasting border, same
  two colours (Claude ≥12, Codex 24 from SC 2.5.8 target size, which is a
  pointer-target rule, not a perception threshold).
- Rung 2 (recorded, not built): 44 × 44 px wedge-shaped chevron on the nearest
  viewport edge (Wedge > Halo on accuracy is a search-snippet claim 🔍, not
  verified against the text).

## 3. Untrusted page text and structured output

**Settled.**
- Output constraint is the strongest defence for this task shape: a closed id
  vocabulary (`enum` of the capture's ids) makes navigate/exfiltrate payloads
  unexpressible. Spotlighting ✅ (arXiv 2403.14720): delimiting alone roughly
  halves a ~60% ASR and is spoofable; randomised datamarking brings QA ASR to
  ~1%. Instruction hierarchy ✅ (2404.13208): rules in the system/developer
  role, page data in the user turn, never concatenated. WASP ✅ (2504.18575):
  diversion still 17–86% in agent settings; a defensive system prompt cut ASR
  32→17% but utility 60→46%, so **the runner must score utility alongside
  attack success**. Semantic UI-element injection ✅ (2604.07831, ECCV 2026):
  overlays on the *screenshot* steer VLM grounding 3.5–6.9× over random; MIRAGE
  ✅ (2605.28116) 23–30% ASR on mobile GUI agents.
- Residual class no schema fixes: attacker-favoured *valid* id (target
  misdirection). Only evaluation catches it.
- Structured output ✅ (OpenAI docs; gpt-5.4-mini model page): strict mode
  needs `additionalProperties:false` and full `required` on every object,
  object root, ≤10 nesting levels, **≤1,000 enum values**. google-genai ✅:
  `response_mime_type="application/json"` with `response_schema` (Pydantic
  class or dict; SDK validator rejects `additionalProperties`) or
  `response_json_schema` (standard JSON Schema, accepts it).

**Consequence for the design doc:** LOCATE_PROMPT rules move to the system
role; the inventory is sent as canonical JSON between per-request random
delimiters, every untrusted string datamarked with a per-request private-use
marker, ids raw; `highlights[].id` is an `enum` of the capture's ids built per
request, with `inventoryMaxNodes` (default 900) so the enum stays under
OpenAI's 1,000 cap and a string+server-validation fallback above it; one
Pydantic model is the only schema definition, `strictify()` produces the
OpenAI variant, the class itself is handed to Gemini; one test parses a golden
fixture through both and asserts enum == inventory ids and no object without
`additionalProperties:false`. The adversarial fixture covers: imperative
override, fake role/delimiter breakout, fake JSON output, authority spoof,
out-of-vocabulary id, attacker-favoured valid id, zero-width/homoglyph text,
payload at the end of a long node, and an instruction rendered only in the
screenshot; scored separately for correct grounding, attacker-id selection,
invalid ids and benign utility.

## Bibliography

- Schiepanski. Beyond Pixels: DOM downsampling (D2Snap). arXiv 2508.04412 ✅ https://arxiv.org/abs/2508.04412
- Kwon & Lee. Region4Web. arXiv 2605.07134 ✅ https://arxiv.org/abs/2605.07134
- Deng et al. Mind2Web. arXiv 2306.06070 ✅ https://arxiv.org/abs/2306.06070
- Zhou et al. WebArena. arXiv 2307.13854 ✅ https://arxiv.org/abs/2307.13854
- Drouin et al. BrowserGym. arXiv 2412.05467 ✅ https://arxiv.org/abs/2412.05467
- Zheng et al. SeeAct. arXiv 2401.01614 ✅ https://arxiv.org/abs/2401.01614
- Koh et al. VisualWebArena. arXiv 2401.13649 ✅ https://arxiv.org/abs/2401.13649
- Gou et al. UGround / SeeAct-V. arXiv 2410.05243 ✅ https://arxiv.org/abs/2410.05243
- AgentOccam. arXiv 2410.13825 ✅ https://arxiv.org/abs/2410.13825
- LineRetriever. arXiv 2507.00210 ✅ https://arxiv.org/abs/2507.00210
- A11y-Compressor. arXiv 2605.00551 ✅ https://arxiv.org/abs/2605.00551
- Nguyen et al. PageGuide. arXiv 2604.23772 ✅ https://arxiv.org/abs/2604.23772
- Playwright aria snapshots ✅ https://playwright.dev/docs/aria-snapshots
- browser-use interactive-element detection ✅ https://deepwiki.com/browser-use/browser-use/5.3-interactive-element-detection
- W3C. WCAG 2.2 Understanding 2.4.11, 2.4.13, 1.4.11, 2.2.2, 2.3.3, 2.5.5 ✅ https://www.w3.org/WAI/WCAG22/Understanding/
- W3C. Technique C40, two-colour focus indicator ✅ https://www.w3.org/WAI/WCAG22/Techniques/css/C40
- W3C. Technique C39 ✅ https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html
- W3C. CSS Color Adjustment Module Level 1 ✅ https://www.w3.org/TR/css-color-adjust-1/
- MDN. transform (containing block for fixed) ✅ https://developer.mozilla.org/en-US/docs/Web/CSS/transform
- Tang, Manduchi & Chung. Screen magnification for readers with low vision. ASSETS 2023 ✅ https://doi.org/10.1145/3597638.3608383
- Zhao et al. IJHCS 2009 (highlighting and magnifier visual search) 🔍 https://doi.org/10.1016/j.ijhcs.2009.03.006
- Gaspelin et al. JEP:HPP 2016 (abrupt onset vs sustained motion) 🔍 https://doi.org/10.1037/xhp0000214
- Baudisch & Rosenholtz. Halo. CHI 2003 ✅ https://doi.org/10.1145/642611.642695
- Gustafson et al. Wedge. CHI 2008 ✅ https://doi.org/10.1145/1357054.1357179
- Hines et al. Spotlighting. arXiv 2403.14720 ✅ https://arxiv.org/abs/2403.14720
- Wallace et al. Instruction hierarchy. arXiv 2404.13208 ✅ https://arxiv.org/abs/2404.13208
- WASP. arXiv 2504.18575 ✅ https://arxiv.org/abs/2504.18575
- InjecAgent. arXiv 2403.02691 🔍 https://arxiv.org/abs/2403.02691
- AgentDojo. arXiv 2406.13352 🔍 https://arxiv.org/abs/2406.13352
- Yang et al. Semantic-level UI element injection. arXiv 2604.07831 (ECCV 2026) ✅ https://arxiv.org/abs/2604.07831
- Guo et al. MIRAGE. arXiv 2605.28116 ✅ https://arxiv.org/abs/2605.28116
- OpenAI. Structured Outputs guide ✅ https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI. gpt-5.4-mini model page ✅ https://developers.openai.com/api/docs/models/gpt-5.4-mini
- Google. Gemini structured output ✅ https://ai.google.dev/gemini-api/docs/structured-output
- Google. python-genai SDK docs ✅ https://googleapis.github.io/python-genai/
