# Campaign QA Dashboard — Design Brainstorm

## Context
Internal workflow tool for OMD/Jump450 team managing MSC Cruises paid media campaigns.
Branding: OMD Red (#E8321A), MSC Navy (#000033), MSC secondary blues.
Users: Campaign builders, QA reviewers (Manager, AD), MD final sign-off (Jake).

---

<response>
<probability>0.07</probability>
<idea>

**Design Movement:** Precision Instrument / Swiss Grid Modernism

**Core Principles:**
1. Every pixel earns its place — no decorative elements, only functional ones
2. Data hierarchy through weight and scale, not color noise
3. Workflow clarity: the checklist IS the interface, nothing competes with it
4. Status communicated through tight, coded visual language (not verbose labels)

**Color Philosophy:**
- White (#FFFFFF) dominant background — clinical clarity
- MSC Navy (#000033) for all structural chrome (sidebar, headers, section labels)
- OMD Red (#E8321A) as the single action color — CTAs, active states, progress
- Neutral gray (#F4F4F5) for section backgrounds and zebra rows
- Green (#22C55E) and Amber (#F59E0B) only for pass/fail status pills — never decorative

**Layout Paradigm:**
- Fixed left sidebar (240px) with campaign list and navigation
- Main content area: full-height scrollable checklist with sticky section headers
- Top bar: campaign metadata strip (name, platform, market, ID) always visible
- Three-column reviewer status bar pinned at top of each section

**Signature Elements:**
1. Thin red left-border accent on active/selected checklist items
2. Compact reviewer initials badges (B / Q1 / Q2 / MD) with color-coded completion rings
3. Section progress bars — thin, red, flush to section header bottom edge

**Interaction Philosophy:**
- Single-click toggle for pass/fail/N-A — no modals, no confirmation dialogs
- Inline notes field expands on hover, collapses when empty
- Keyboard-navigable checklist (Tab + Space)

**Animation:**
- Progress bar fill: 300ms ease-out on state change
- Status badge: subtle scale(1.05) pulse on completion
- Section collapse/expand: 200ms height transition
- No page transitions — instant navigation

**Typography System:**
- Display/Headers: DM Sans 600 — geometric, authoritative
- Body/Checklist: DM Sans 400 — clean, highly legible at small sizes
- Metadata/Labels: DM Mono 400 — campaign IDs, dates, codes feel technical
- Size scale: 11px labels → 13px body → 15px section headers → 20px page titles

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

**Design Movement:** Editorial Command Center / Newsroom Dashboard

**Core Principles:**
1. Information density without cognitive overload — everything visible, nothing hidden
2. Role-based visual hierarchy: the reviewer tier you're in is always foregrounded
3. Audit trail as a first-class citizen — every action timestamped and attributed
4. The dashboard feels like a professional instrument, not a form

**Color Philosophy:**
- Off-white (#FAFAF9) background with subtle warm undertone — less sterile than pure white
- MSC Navy (#000033) for primary chrome and text
- OMD Red (#E8321A) for active reviewer tier highlight and primary actions
- Light slate (#E2E8F0) for section dividers and table backgrounds
- Status: Emerald (#10B981) pass, Rose (#F43F5E) fail, Slate (#94A3B8) N/A

**Layout Paradigm:**
- Top navigation with client logo + campaign selector dropdown
- Two-panel layout: left 30% = campaign overview + section nav, right 70% = active checklist
- Sticky reviewer sign-off bar at bottom of viewport
- Collapsible ad set group columns (LAL Combo, Mini LAL, Interest Combo)

**Signature Elements:**
1. Horizontal progress timeline at top showing Builder → QA1 → QA2 → MD stages
2. Color-coded row backgrounds per reviewer tier (subtle tint when that tier is active)
3. Floating "Sign Off" CTA that appears when all items in a section are complete

**Interaction Philosophy:**
- Reviewer selects their role on entry, checklist adapts to show their column
- Completed sections auto-collapse with a summary badge
- Notes field with character count for accountability

**Animation:**
- Section completion: confetti-free — just a clean green sweep across the section header
- Role selection: smooth slide-in of the active column
- Sign-off: button morphs to a checkmark badge with name + timestamp

**Typography System:**
- Headers: Syne 700 — distinctive, editorial
- Body: Inter 400/500 — familiar, readable
- Code/IDs: JetBrains Mono — technical fields
- Hierarchy: 12px metadata → 14px checklist items → 18px section headers → 28px page title

</idea>
</response>

<response>
<probability>0.05</probability>
<idea>

**Design Movement:** Structured Minimalism / Agency Operations Toolkit

**Core Principles:**
1. The tool should feel like it was built by the agency, for the agency — not generic SaaS
2. Dual-brand presence (OMD + MSC) without visual conflict
3. Workflow stages are spatially distinct — you always know where you are in the process
4. Dense but breathable — pack information without crowding

**Color Philosophy:**
- Pure white (#FFFFFF) canvas
- MSC Navy (#000033) as the dominant structural color (sidebar, headers)
- OMD Red (#E8321A) as accent/action — sparingly used for maximum impact
- MSC Lapis (#2D6C93) for secondary interactive elements and links
- Warm gray (#6B7280) for supporting text and metadata

**Layout Paradigm:**
- Full-width top header with dual logos (OMD left, MSC right) and campaign context
- Tabbed section navigation (Planning | Campaign | Ad Sets | Ads | Post-Launch)
- Main area: checklist table with item, description, and three reviewer columns
- Right drawer: notes, history, and sign-off panel

**Signature Elements:**
1. Dual-logo header strip with a subtle diagonal separator between OMD and MSC branding
2. Reviewer column headers with avatar initials and role badge
3. Section completion percentage ring next to each tab label

**Interaction Philosophy:**
- Tab-based navigation keeps sections visually separated
- Reviewer columns can be locked/unlocked per role
- Export button always visible in header

**Animation:**
- Tab switch: 150ms fade + slight Y-translate
- Checkbox toggle: spring animation on the checkmark
- Progress ring: smooth arc fill on item completion

**Typography System:**
- Headers: Space Grotesk 600/700 — modern, structured
- Body: Space Grotesk 400 — unified family, clean
- Mono: Space Mono — for IDs and technical fields
- Scale: 11px captions → 13px items → 16px section tabs → 22px page title

</idea>
</response>

---

## Selected Direction
**Precision Instrument / Swiss Grid Modernism** (Response 1)

Rationale: This is an internal workflow tool used under time pressure. Clarity and speed of use trump visual flair. The Swiss Grid approach ensures the checklist itself is the hero — reviewers can scan, toggle, and sign off without visual noise. The OMD Red accent provides brand presence without competing with the data.
