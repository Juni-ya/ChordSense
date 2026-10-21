# Design Decisions

- Entry mode: Step-by-step
- Genre: Atmospheric Sci-Fi / Forensic Acoustic Decoding
- Director: Denis Villeneuve
- Film: *Arrival* (2016)
- Cinematographer: Bradford Young
- Niche: AI Audio Analysis & Real-Time Harmonic Transcription
- Pages: 1 (Homepage & Real-Time Acoustic Laboratory)
- Major page roles:
  - Observation Deck & Signal Ingest (Hero / Input)
  - The Glass Chamber (Active Chord Transceiver)
  - Spectrographic Frequency Progression (Chronological Chord Tape)
  - Acoustic Calibration Terminal (Key / Capo / Micro-Timing Sync)
- Image placeholders: None (pure acoustic interface, video canvas, and reactive frequency geometry)
- Sub-agent delegation plan: Single lead agent architecture

---

## Demo Uniqueness Audit

- **Previous-work audit:**
  - Centered marketing hero with floating badges above an input field
  - Standard 2-column dashboard (video on left 2 columns, chord grid on right 3 columns)
  - Rounded `rounded-xl` / `rounded-2xl` cards with green accents
  - Pill-shaped metadata tags (`astro-badge`)
- **Recurring traits to avoid:**
  - Standard SaaS card grids
  - High-saturation neon borders and glows
  - Friendly bubbly rounded corners
  - Standard top navbar with left-logo right-button setup
- **Shell-ban list:**
  - ❌ FORBIDDEN: Centered text-above-input hero block
  - ❌ FORBIDDEN: Standard 2-column dashboard layout (player left, grid right)
  - ❌ FORBIDDEN: Rounded `rounded-2xl` puffy cards
  - ❌ FORBIDDEN: Saturated neon green borders or pill badges
  - ❌ FORBIDDEN: Generic gradients or ambient blurred blobs
- **Primary composition family:**
  - `Cutaway Monolith` + `Panoramic Slab` (Letterbox Cinema `#4`, Center-Weighted Monument `#1`)
- **Why this family differs from the most recent output:**
  - The previous output was a modular bento-box grid with rounded corners and centered text. The new composition is a monumental, $2.39:1$ anamorphic widescreen viewing chamber inspired by the monolithic research vessel in *Arrival*. Layout elements are architectural, weighted, zero-radius to 2px, and structured as an environmental observation deck with continuous horizontal frequency tracking.
- **Wireframe-level uniqueness test:**
  - Stripped of all styling, the wireframe is an ultra-wide letterbox stage flanked by forensic telemetry bars, a centered monolithic observation viewport ("The Glass Chamber"), and a horizontal seismic chord strip running across the base of the frame, completely distinct from any card-grid dashboard.

---

## Research Notes

### Research Boundary
- **Film research is observational input, not a spec:**
  - *Arrival* (2016) explores acoustic communication across nonlinear time, deep sub-bass vibration (Jóhann Jóhannsson), and naturalistic overcast Montana mist (Bradford Young).
- **What is being translated into web language:**
  - Colossal scale and breathing room: Monolithic negative space where interface elements feel suspended in zero gravity.
  - Low-key chiaroscuro and atmospheric mist: Desaturated slate-black palette (`#08090a`, `#111417`, `#1a2024`) with warm incandescent phosphor amber (`#d4a35f` / `#e5c07b`) used with forensic restraint.
  - Forensic acoustic telemetry: Thin hairline viewfinders, coordinate markers, corner brackets (`#8`), and dot matrix grids (`#9`) simulating the military field laboratory.
  - Circular harmonic perception: Chords viewed not as static boxes, but as resonant harmonic envelopes that evolve continuously through time.
- **What must not be flattened into product-template logic:**
  - Do NOT reduce the layout into another 3-column card grid or generic SaaS landing page.
  - Do NOT display meta process labels ("Chapter 1", "Villeneuve Mode", "Cinematic Calibrated") in the user-facing UI.

### Research Sources
- **Director source:** Denis Villeneuve retrospective & *Arrival* production archives (2016).
- **Film source:** *Arrival* (Paramount Pictures / FilmNation / 21 Laps Entertainment). Cinematography by Bradford Young, ASC; Production Design by Patrice Vermette; Music by Jóhann Jóhannsson.
- **Secondary analysis:** American Cinematographer (December 2016 issue, "Alien Language"); FrameThrower Colorimetry Breakdown; No Film School naturalistic lighting profile.
- **Niche sources:**
  - Teenage Engineering (forensic minimal audio hardware interface)
  - IRCAM Paris Sound Laboratory (spectral acoustic analysis tooling)

### Film Palette
- **Primary Background (The Void / Chamber):** `#08090a` (Deep Obsidian Void)
- **Secondary Surface (Muted Montana Meadow Mist):** `#111417` (Charcoal Slate)
- **Tertiary Surface / Paneling (The Shell Monolith):** `#181e22` (Muted Steel Slate)
- **Hairlines & Brackets:** `#2a333a` / `rgba(255, 255, 255, 0.08)`
- **Incandescent Phosphor Accent (Practical Lamp Warmth):** `#d4a35f` (Amber Signal)
- **Secondary Accent (Subdued Acoustic Mint):** `#4ade80` (Acoustic Lock Indicator)
- **Primary Text:** `#eceeed` (Fog White)
- **Secondary Text:** `#86949e` (Overcast Slate)
- **Muted Text / Telemetry:** `#4a5761` (Deep Mist)

### Director Signatures (Denis Villeneuve & Bradford Young)
1. **Monolithic Negative Space:** Massive dark volumes that dwarf the human observer, creating reverence, tension, and intense focus.
2. **Soft Motivated Naturalism:** Avoidance of harsh artificial neon gloss; soft diffused practical illumination that emerges organically from the dark.
3. **Forensic Acoustic Decentering:** Information is placed along architectural edges, corner viewfinders, and letterbox gutters, leaving the central observation plane sacred.

### Film Translation Notes
- **Framing:** $2.39:1$ anamorphic letterbox framing (`#4 Letterbox Cinema`), corner brackets (`#8`), coordinate markers (`#10 Cross Marks`).
- **Rhythm:** Slow, deliberate, steady transitions; no frantic jumps or flashy web gimmicks.
- **Lighting:** Zero gradients. Flat, solid desaturated surfaces with precise contrast cutaways.
- **Space:** Expansive letterboxed stage with centered observation portal.
- **Materiality:** Matte stone, anti-reflective glass, cold slate steel, and amber phosphor cathode indicators.
- **What should stay ambiguous or restrained:** The system avoids noisy animations; audio waveforms and harmonic chords speak with quiet mathematical authority.
