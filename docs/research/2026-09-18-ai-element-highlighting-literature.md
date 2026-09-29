# AI Element Highlighting for Magnifier Users: Literature Map

Synthesized 2026-09-18 from two independent searches (Claude Opus 5, Codex
gpt-5.6-sol) plus DOI verification. Scope: LLM/agent web accessibility,
grounded AI answers, on-screen pointing, low-vision web HCI, and the
frameworks that make a "ladder of assistance" defensible.

## 1. Design space

Six dimensions separate the systems that exist. UniLens's planned rungs are
marked ★.

| System | Grounding source | What the user sees | Initiative | Population | Viewport assumed |
|---|---|---|---|---|---|
| PageGuide [1] | live DOM + non-HTML content | in-page evidence highlight; multi-step guide | point → lead | general (N=92, v5) | full, unmagnified |
| DIANA "Hey Dashboard!" [2] | dashboard structure | in-dashboard highlights while explaining | point while answering | general | full |
| DashGuide [3] | author demonstration | anchored step tours | authored walk | general | full |
| Task Mode [4] | DOM + LLM relevance | irrelevant content hidden | filter (below "point") | screen-reader users | linear |
| ConWeb [5], Savant [6] | page / a11y structure | conversation; automated actions | answer → act | blind, BLV | n/a |
| A11y-CUA [7] | a11y tree + pixels (agent-internal) | nothing; agent acts | act | BLV + sighted traces, **magnifier condition** | n/a |
| SteeringWheel [8], TableView [9], crumbs [10] | DOM / table semantics | restructured or annotated magnified view | none (no model) | magnifier users | magnified |
| On-Cursor Visual Context [11] | chart structure | context rendered at the cursor | none | low vision | magnified / partial |
| Set-of-Mark [12], SeeAct [13] | screenshot marks / hybrid HTML | nothing; marks serve the model | act | the agent | n/a |
| Halo [14], Wedge [15] | coordinates | off-screen direction + distance cues | point | general, mobile/maps | small, explicit |
| Stencils [16], EverTutor [17], Torta [18], Driver.js | authored / demonstrated steps | spotlight + sequence | authored walk | general, one app | full |
| ★ UniLens | screenshot + id-based DOM inventory, embedded script | highlight; minimap cue; pan on consent; sequenced anchors | point → lead → walk → (act) | **magnifier users** | **magnified, explicit** |

Read the table by column. *Grounding source*: nobody sends the model a
client-built element inventory from an embedded script; extensions scrape,
agents read the a11y tree, SoM marks pixels. *What the user sees*: every
grounded-answer system assumes the evidence lands **in** the viewport. *Viewport
assumed*: every magnifier system has no model; every model system has no
magnifier. The empty cell is the intersection of the last three rows:
**semantic, model-generated pointing that survives a 4–8× viewport**.

Frameworks that name the ladder: Parasuraman, Sheridan & Wickens's stages of
automation (acquisition → analysis → decision → action) [19]: point/lead/walk/
act is a four-stage instance, and should be described as one. Horvitz's
mixed-initiative principles (expected utility of acting vs. asking, cost of
intrusion) [20] are the decision rule for "pan or ask first". Shneiderman's
HCAI decouples automation from control [21]: the ladder should raise both.

## 2. Prior work by theme, one line each

**Grounded answers on live pages**
- PageGuide [1]: grounds LLM answers to DOM and non-HTML content; Find and
  Guide modes. New: in-situ evidence highlighting for *verification* on
  arbitrary live pages. Cite by version: v5 (2026-09-12) reports N=92,
  accuracy 65→77%, time 73→67 s; the project page and earlier versions report
  N=53 with 90→96% / 71→81%.
- DIANA [2]: voice, text, pointing and in-dashboard highlights for onboarding.
  New: LLM-mediated joint attention, the closest "AI points while explaining"
  outside accessibility.
- DashGuide [3]: generates editable anchored tours from an author's
  demonstration. New: LLM-assisted *authoring*, not runtime grounding.
- Attribution Gradients [22]: unfold an AI claim into highlighted source
  regions. New: progressive, context-preserving verification, for PDFs.
- Set-of-Mark [12]: numbered marks on a screenshot let GPT-4V refer to
  regions. New: training-free grounding; marks serve the model, not the user.
- SeeAct [13]: planning is strong, element grounding is the bottleneck; hybrid
  HTML+visual beats SoM. New: isolates grounding as the failure point.

**Agents as assistive technology**
- Task Mode [4] (this lab): LLM keeps task-relevant DOM, hides the rest;
  screen-reader/sighted time gap 2× → 1.2×. New: assistance by subtraction.
- A11y-CUA [7] (this lab): 40.4 h of BLV and sighted traces; computer-use
  agent success **78.3% → 28.3% under magnification**. New: first
  quantification of the agent/AT mismatch; the best motivation number for
  this project.
- ConWeb [5]: LLM conversational browser vs. screen readers, 30 BLV
  participants. New: controlled evaluation of natural-language navigation.
- Savant [6]: natural language → screen-reader action sequences. New:
  application-independent automation for blind users.
- Voice shopping CUA [23]: Wizard-of-Oz, 12 VI participants. New:
  disability-centred study of agentic *action* and its breakdowns.
- "Zooming In" [24]: case study of agentic browsers with a low-vision expert.
  New: the only low-vision-specific account of agentic browsing; fluid but
  opaque.
- Say It My Way [25]: control in conversational VQA with blind users. New:
  control matters most when the system is wrong.
- Delegation over time [26]: delegation to a navigation robot evolves with
  exposure. New: willingness to hand over is learned, which argues for a
  ladder rather than a switch.
- Accessibility repair agents [27, 28]: LLMs fixing WCAG at the source;
  Wanscher et al. show unverified CSS edits regress pages as often as they
  fix them. New: the *opposite* intervention point (author-side), and
  regressions as first-class harms.

**Low vision, magnification, orientation**
- SteeringWheel [8]: locality-preserving magnification, +20% efficiency,
  N=15. New: semantics, not pixels, as the unit of magnification.
- TableView [9]: repeated records reflowed into compact tables, panning time
  −73%. New: task-specific spatial restructuring.
- Tang et al. [29]: lens vs. full-screen magnification, N=20; no universal
  winner. New: the overview/detail trade-off magnifier users actually pay.
- Annotations and crumbs [10]: repeated headers and visited-cell marks in
  magnified tables. New: externalising lost context and history *inside* the
  magnified view.
- Sticky-element audit [30]: fixed consent/nav bars can consume the entire
  magnified viewport. New: responsive layout as an occlusion hazard.
- Bringing Things Closer [31]: "distance" between content and focus as the
  core low-vision cost in office apps.
- On-Cursor Visual Context [11] (this lab): global chart context rendered at
  the cursor. New: context follows the fovea instead of the user hunting.
- Wang, Zhao & Kim [32]: low vision as its own condition in visualisation,
  not a weaker blindness.

**Pointing, cues, attention**
- Halo [14], Wedge [15]: off-screen direction and distance at the viewport
  edge; Wedge removes clutter. New: awareness without leaving the view.
- HCEye [33]: dynamic highlighting stays attention-grabbing under cognitive
  load, 150 pages. New: highlight effectiveness is load-dependent.
- Kraut, Gergle & Fussell [34]; Fussell et al. [35]: deixis over a shared
  visual space is a conversational resource. The theoretical charter for
  "the model points".

**Guided sequences**
- Stencils [16], EverTutor [17], Torta [18]: spotlight overlays with step
  validation, authored or demonstrated ahead of time. New, collectively: the
  step-anchored overlay primitive. Driver.js is the productised descendant.
  All assume one app and an authoring pass.

**Reliance and error cost**
- Buçinca, Malaya & Gajos [36]: cognitive forcing reduces overreliance. A
  confident highlight is an unhedged assertion.
- Schemmer et al. [37]: explanations raise reliance without improving
  rejection of wrong advice.
- Misfitting With AI [38]: how blind people verify and contest AI errors.
  New: error handling as user labour.
- Surfacing variation [39]: disagreement across MLLM descriptions as an
  accessible uncertainty signal.

## 3. Gaps

**G1. Grounded evidence is undeliverable at magnification.** PageGuide and
DIANA highlight in the viewport; at 4–8× the highlighted element is usually
outside it. Halo/Wedge solve off-screen awareness for coordinates, never for
model-selected semantic targets, never under magnification. Nobody joins
them. [1, 2, 14, 15, 8]

**G2. No measure of referential success for a human.** SoM and SeeAct score
whether the *agent* hit the element; PageGuide scores verification accuracy
for sighted users; A11y-CUA scores agents under a magnifier condition. There
is no metric for whether a *low-vision person* acquired the element the model
named. [12, 13, 1, 7]

**G3. Assistance is binary where the evidence says it should be graded.**
Delegation is learned over exposure [26]; control matters most on failure
[25]; the frameworks supply the vocabulary [19–21]. No assistive web system
instantiates point → lead → walk → act with consent at each rung. Savant and
the shopping CUA jump from conversation to automation; Task Mode filters. [6,
23, 4]

**G4. The cost of a wrong pointer is unmeasured, and it is spatial.** A
highlight is perceptually forceful [33]; explanations inflate reliance [36,
37]. For a magnifier user a mis-highlight costs a pan plus re-acquisition of
reading position: an asymmetric, low-vision-specific error cost nobody has
quantified. [33, 36, 37, 38]

**G5. Viewport motion as an assistive action has no empirical basis.** WCAG
2.2.2 and 2.3.3 constrain motion; magnifier users report auto-scroll
disorientation; yet pan-to-target is exactly what rung 2 needs. Horvitz gives
the decision rule [20]; no one has run the study. [20, 29]

**G6. Guided tours are authored, not generated, and never reflow for
magnification.** Stencils/EverTutor/Torta/DashGuide/Driver.js need an
authoring pass per app; none synthesise steps per question from a live DOM
inventory, and none re-anchor when the user is zoomed. [16–18, 3]

**G7. DOM ids are necessary, not sufficient.** SeeAct found hybrid grounding
beats DOM-only; PageGuide's latest scope includes non-HTML content. Canvas,
charts, overlays, stale and post-mutation nodes are where an id-based
inventory fails. [13, 1]

## 4. Candidate novelty claims

**C1. Off-screen-aware grounded pointing for magnifier users.** The first
system in which a VLM's answer is anchored to page elements *and* rendered so
the anchor is reachable when it lies outside a magnified viewport (minimap
cue, pan on consent). Distinguish from PageGuide (same grounding contract,
in-viewport only, sighted, no magnification) [1]; Halo/Wedge (cues without
semantics or a model) [14, 15]; On-Cursor Visual Context (low-vision context
restoration, charts, no model-chosen target) [11]. Closes G1.

**C2. An instrumented agency ladder for assistive web guidance.** Point /
lead / walk / act as consented rungs in one system, with evidence on where
magnifier users stop climbing and why. Distinguish from PageGuide's two modes
(no consent model, no accessibility framing) [1]; Task Mode (subtractive,
screen-reader users) [4]; Parasuraman/Shneiderman (frameworks, never
instantiated for AT) [19, 21]; Hata et al. (delegation dynamics, robot
navigation) [26]. Closes G3, feeds G5.

**C3. A cost model for mis-pointing under magnification.** Quantify what a
wrong highlight costs when repair means panning and re-finding the reading
position, and test whether a spatial uncertainty display (adapting [39])
restores calibration. Distinguish from Buçinca (non-spatial) [36] and
Alharbi (descriptions, blind users) [38]. Closes G2 and G4, and is the study
that makes C1 and C2 defensible.

**C4. Embeddable, id-based grounding contract.** Grounding delivered by a
page-embedded script over a client-built element inventory rather than a
browser extension or an a11y-tree scrape: deployable by site owners, portable
across models. Distinguish from PageGuide and Task Mode (extensions) [1, 4];
SoM/SeeAct (marks for agent consumption) [12, 13]; A11YRepair (author-side
source fixes) [28]. Engineering novelty; do not lead with it at CHI.

**Lineage.** Task Mode, A11y-CUA and On-Cursor Visual Context are this lab's
work. The paper positions naturally as the next step: Task Mode subtracted;
A11y-CUA measured the agent gap under magnification; On-Cursor brought
context to the fovea; this work brings the model's *referent* to the fovea.

C1 + C2 are the load-bearing pair. C3 is the evaluation design. The
phase-1 study cannot be "does highlighting help" (PageGuide answered that);
it must be "what does a magnifier user need beyond the highlight".

## 5. Bibliography

All DOIs resolve via doi.org / Crossref as of 2026-09-18. Driver.js and
Browser Use are software; cite as URLs.

1. Nguyen, T. et al. PageGuide: Browser Extension to Assist Users in Navigating a Webpage and Locating Information. arXiv, 2026 (v5, 2026-09-12). https://arxiv.org/abs/2604.23772
2. Dhanoa, V. et al. Hey Dashboard!: Supporting Voice, Text, and Pointing Modalities in Dashboard Onboarding. CHI '26. https://doi.org/10.1145/3772318.3791766
3. Hoque, N. & Sultanum, N. DashGuide: Authoring Interactive Dashboard Tours for Guiding Dashboard Users. CGF/EuroVis 2025. https://arxiv.org/abs/2504.17150
4. Gubbi Mohanbabu, A., Sechayk, Y. & Pavel, A. Task Mode: Dynamic Filtering for Task-Specific Web Navigation using LLMs. ASSETS '25. https://doi.org/10.1145/3663547.3746401
5. Esposito, A. et al. Conversational AI for Digital Accessibility: An Experimental Study Involving Blind and Low Vision Users. IJHCI 2026. https://doi.org/10.1080/10447318.2026.2659951
6. Kodandaram, S. R. et al. Enabling Uniform Computer Interaction Experience for Blind Users through Large Language Models. ASSETS '24. https://doi.org/10.1145/3663548.3675605
7. Gubbi Mohanbabu, A. et al. A11y-CUA Dataset: Characterizing the Accessibility Gap in Computer Use Agents. CHI '26. https://doi.org/10.1145/3772318.3791896 (arXiv: https://arxiv.org/abs/2602.09310)
8. Billah, S. M. et al. SteeringWheel: A Locality-Preserving Magnification Interface for Low Vision Web Browsing. CHI '18. https://doi.org/10.1145/3173574.3173594
9. Lee, H.-N., Uddin, S. & Ashok, V. TableView: Enabling Efficient Access to Web Data Records for Screen-Magnifier Users. ASSETS '20. https://doi.org/10.1145/3373625.3417030
10. Sandnes, F. E., Akter, N. & MacKenzie, I. S. Improving the Accessibility of Web Tables for Magnifier Users with Annotations and Crumbs. ICCHP 2026, LNCS 16867. https://doi.org/10.1007/978-3-032-31308-9_69
11. Sechayk, Y. et al. Improving Low-Vision Chart Accessibility via On-Cursor Visual Context. CHI '26. https://doi.org/10.1145/3772318.3791165
12. Yang, J. et al. Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V. arXiv, 2023. https://arxiv.org/abs/2310.11441
13. Zheng, B. et al. GPT-4V(ision) is a Generalist Web Agent, if Grounded. ICML 2024. https://arxiv.org/abs/2401.01614
14. Baudisch, P. & Rosenholtz, R. Halo: A Technique for Visualizing Off-Screen Objects. CHI '03. https://doi.org/10.1145/642611.642695
15. Gustafson, S., Baudisch, P., Gutwin, C. & Irani, P. Wedge: Clutter-Free Visualization of Off-Screen Locations. CHI '08. https://doi.org/10.1145/1357054.1357179
16. Kelleher, C. & Pausch, R. Stencils-Based Tutorials: Design and Evaluation. CHI '05. https://doi.org/10.1145/1054972.1055047
17. Wang, C.-Y. et al. EverTutor: Automatically Creating Interactive Guided Tutorials on Smartphones by User Demonstration. CHI '14. https://doi.org/10.1145/2556288.2557407
18. Mysore, A. & Guo, P. J. Torta: Generating Mixed-Media GUI and Command-Line App Tutorials Using Operating-System-Wide Activity Tracing. UIST '17. https://doi.org/10.1145/3126594.3126628
19. Parasuraman, R., Sheridan, T. B. & Wickens, C. D. A Model for Types and Levels of Human Interaction with Automation. IEEE Trans. SMC-A, 2000. https://doi.org/10.1109/3468.844354
20. Horvitz, E. Principles of Mixed-Initiative User Interfaces. CHI '99. https://doi.org/10.1145/302979.303030
21. Shneiderman, B. Human-Centered Artificial Intelligence: Reliable, Safe & Trustworthy. IJHCI 2020. https://doi.org/10.1080/10447318.2020.1741118
22. Kambhamettu, H. et al. Attribution Gradients: Incrementally Unfolding Citations for Critical Examination of Attributed AI Answers. arXiv, 2025. https://arxiv.org/abs/2510.00361
23. Shin, S. et al. Toward Independent Online Shopping of the Visually Impaired Through Voice-based Computer-Using Agent. CHI '26. https://doi.org/10.1145/3772318.3791681
24. Colazzo, L. & Anzillotti, G. "Zooming In" on Agentic Web Browsers as Assistive Technologies. arXiv, 2026. https://arxiv.org/abs/2606.24870
25. Zamiri Zeraati, S. et al. Say It My Way: Exploring Control in Conversational Visual Question Answering with Blind Users. CHI '26. https://doi.org/10.1145/3772318.3791834
26. Hata, K. et al. How Does Delegation in Social Interaction Evolve Over Time? Navigation with a Robot for Blind People. CHI '26. https://doi.org/10.1145/3772318.3791439
27. Wanscher, L. B. et al. From Blind Edits to Verified Repair: Building Trustworthy User-Side LLM Agents for Web Accessibility. arXiv, 2026. https://arxiv.org/abs/2608.24913
28. Huang, K. et al. A11YRepair: Bridging Web Accessibility Barriers via Knowledge-Enhanced Divide-and-Conquer Repair. arXiv, 2026. https://arxiv.org/abs/2606.21926
29. Tang, H., Manduchi, R. & Chung, S. Screen Magnification for Readers with Low Vision: A Study on Usability and Performance. ASSETS '23. https://doi.org/10.1145/3597638.3608383
30. Sandnes, F. E. "Consent Notices Are Obstructing My View": Viewing Sticky Elements on Responsive Websites under the Magnifying Glass. Displays, 2024. https://doi.org/10.1016/j.displa.2023.102579
31. Lee, H.-N., Ashok, V. & Ramakrishnan, I. V. Bringing Things Closer: Enhancing Low-Vision Interaction Experience with Office Productivity Applications. PACM HCI (CSCW) 2021. https://doi.org/10.1145/3457144
32. Wang, Y., Zhao, N. & Kim, S. How Do Low-Vision Individuals Experience Information Visualization? CHI '24. https://doi.org/10.1145/3613904.3642188
33. Das, A. et al. Shifting Focus with HCEye: Exploring the Dynamics of Visual Highlighting and Cognitive Load on User Attention and Saliency Prediction. PACM HCI (ETRA) 2024. https://doi.org/10.1145/3655610
34. Kraut, R. E., Gergle, D. & Fussell, S. R. The Use of Visual Information in Shared Visual Spaces. CSCW '02. https://doi.org/10.1145/587078.587084
35. Fussell, S. R. et al. Gestures Over Video Streams to Support Remote Collaboration on Physical Tasks. Human–Computer Interaction, 2004. https://doi.org/10.1207/s15327051hci1903_3
36. Buçinca, Z., Malaya, M. B. & Gajos, K. Z. To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted Decision-making. PACM HCI (CSCW) 2021. https://doi.org/10.1145/3449287
37. Schemmer, M. et al. Appropriate Reliance on AI Advice: Conceptualization and the Effect of Explanations. IUI '23. https://doi.org/10.1145/3581641.3584066
38. Alharbi, R. et al. Misfitting With AI: How Blind People Verify and Contest AI Errors. ASSETS '24. https://doi.org/10.1145/3663548.3675659
39. Chen, M., Iyer, S. & Pavel, A. Surfacing Variations to Calibrate Perceived Reliability of MLLM-generated Image Descriptions. ASSETS '25. https://doi.org/10.1145/3663547.3746393

Software: Driver.js https://driverjs.com/ · Browser Use https://github.com/browser-use/browser-use

## Reconciliation notes

- The two searches overlapped on 19 of 39 entries and agreed on every
  novelty statement for those. Codex contributed the dashboard-onboarding line
  (DIANA, DashGuide), ConWeb, Savant, the repair-agent regression finding, and
  the reliance literature; Opus contributed the 2026 assistive-agent wave, the
  lab's own papers, the tutorial-generation lineage, and the shared-visual-space
  theory. Dropped from Opus: four peripheral 2026 EA/LNCS items (travel
  planning, tactile controls, vibe coding, scene description) as off-topic.
- PageGuide's N differs by version (53 vs 92); pin the version when citing.
- Halo has two ACM DOIs; both resolve; the proceedings DOI is used here.
