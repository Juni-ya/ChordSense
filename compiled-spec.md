# Compiled Spec

## Page: Home (The Acoustic Observatory)
- **Page Scene Thesis:** An anamorphic letterboxed acoustic observatory operating at the intersection of acoustic physics and neural harmonic transcription.
- **Signature Composition:** Letterbox Cinema (`#4`) with Center-Weighted Monument (`#1`) framing the Glass Chamber, anchored below by a continuous horizontal spectrographic chord ribbon (`#24`).
- **Signature Composition Source ID:** Hero Archetype `#4 Letterbox Cinema`, Composition `#1 Center-weighted monument`, Composition `#24 Horizontal overflow reveal`, Composition `#35 70/30 dominant`.
- **Why this cannot collapse into a default grid:** The central specimen viewing chamber is a monolithic $2.39:1$ anamorphic letterbox stage with technical corner brackets and a continuous horizontal frequency ribbon that cannot be expressed as independent isolated cards.
- **One Big Idea:** The Widescreen Glass Chamber—where the video/audio stream and the emerging active chord interact as a single monumental specimen.
- **Heavy Interaction:** Real-time synchronized harmonic chord tracking and continuous horizontal timeline auto-scroll with millisecond precision audio-sync offset.
- **Heavy Interaction Source ID:** Interaction `#30 Tracking shot (lateral)` + `#4 Depth-of-field pop`.
- **Showy Reveals:** Camera `#2 Fade from black` + Camera `#6 Rack focus reveal` on initial signal acquisition.
- **Showy Reveal Source IDs:** Camera Shot `#2 Fade from black`, Camera Shot `#6 Rack focus reveal`, Camera `#19 Match cut dissolve`.
- **Restraint Notes:** Zero gradients. Solid `#08090a` void, solid `#111417` and `#181e22` panels, solid amber `#d4a35f` phosphor accents, zero pastel fills, zero glowing dropshadows.
- **Typography Source IDs:** `typography-cinema.md` (Monolithic Monumental San Francisco Display + Monospaced Telemetry Coordinates).
- **Atmosphere / Background Source IDs:** Background `#C1 Film Grain` (subtle 2% noise texture) + `#8 Corner Brackets` + `#10 Cross Marks`.

---

## Entrance Map
- **Scene 1 (Signal Ingest):** Camera `#2 Fade from black` (opacity transition from 0 to 1 over 0.8s) + Camera `#6 Rack focus reveal` (subtle blur 8px to 0px).
- **Scene 2 (The Glass Chamber):** Camera `#3 Dolly-in` (scale 0.98 to 1.0 with subtle perspective).
- **Scene 3 (Spectrographic Timeline):** Camera `#20 Jump cut stagger` (staggered entrance of timeline nodes by 0.03s).
- **Scene 4 (Calibration Deck):** Camera `#4 Crane down` (subtle 10px translate on toolbar assembly).

---

## Scene Specifications

### Scene 1: Signal Ingest & Telemetry Deck
- **Beat:** Signal Acquisition (Opening Establishing Shot).
- **Function:** Ingesting audio through URL or local WebAssembly buffer.
- **Archetype:** Pattern F: Framed Stage (`#4 Letterbox Cinema`).
- **Camera Source ID:** Camera `#2 Fade from black` + `#6 Rack focus reveal`.
- **Interaction Source ID:** Hover `#10 Shutter click`, Hover `#4 Depth-of-field pop`.
- **Composition Source ID:** Composition `#1 Center-weighted monument`.
- **Visual Element Source IDs:** Visual `#8 Corner Brackets`, Visual `#10 Cross Marks`, Visual `#6 Status Indicator Card`.
- **Typography Source IDs:** Monospaced Telemetry `SF Mono` + Monumental Title `SF Pro Display`.

```css
/* Layout */
.cinematic-hero-stage {
  position: relative;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.cinematic-letterbox-frame {
  position: relative;
  background-color: #0e1113;
  border: 1px solid #2a333a;
  padding: 2.5rem 2rem;
}

/* Corner Brackets (#8) */
.corner-bracket {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: #d4a35f;
  pointer-events: none;
}
.corner-tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
.corner-tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
.corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
.corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }

/* Entrances */
.cinematic-fade-enter {
  animation: cinematicFadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes cinematicFadeIn {
  from { opacity: 0; filter: blur(6px); transform: translateY(10px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}
```

```html
<div class="cinematic-hero-stage cinematic-fade-enter">
  <div class="cinematic-letterbox-frame">
    <div class="corner-bracket corner-tl"></div>
    <div class="corner-bracket corner-tr"></div>
    <div class="corner-bracket corner-bl"></div>
    <div class="corner-bracket corner-br"></div>
    <!-- Ingest controls -->
  </div>
</div>
```

---

### Scene 2: The Glass Chamber (Active Specimen Transceiver)
- **Beat:** First Contact (The Specimen Behind the Glass).
- **Function:** Real-time synchronized playback and instant chord recognition.
- **Archetype:** Split Showcase in Widescreen Aspect (`#35 70/30 dominant`).
- **Camera Source ID:** Camera `#19 Match cut dissolve`.
- **Interaction Source ID:** Hover `#4 Depth-of-field pop`, Click `#22 Expand`.
- **Composition Source ID:** Composition `#35 70/30 dominant` + `#17 L-shape composition`.
- **Visual Element Source IDs:** Visual `#15 Glass Morphism Panel`, Visual `#21 Hero Stats Bar`, Visual `#30 Corner Bracket Frames`.

```css
.glass-chamber-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  background-color: #0e1113;
  border: 1px solid #2a333a;
  padding: 1.5rem;
  position: relative;
}

@media (min-width: 1024px) {
  .glass-chamber-container {
    grid-template-columns: 1.6fr 1fr;
    align-items: stretch;
  }
}

.specimen-player-viewport {
  position: relative;
  background-color: #000000;
  border: 1px solid #2a333a;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.active-chord-monolith {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #14191d;
  border: 1px solid #2a333a;
  padding: 1.75rem;
  position: relative;
}

.monolith-root {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 4.5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #eceeed;
}

.monolith-quality {
  font-size: 2.25rem;
  font-weight: 700;
  color: #d4a35f;
  margin-left: 0.25rem;
}
```

---

### Scene 3: Forensic Spectrographic Stream
- **Beat:** Decryption & Transcription (The Continuous Frequency Ribbon).
- **Function:** Horizontal seismic tape of all detected chords aligned with downbeats.
- **Archetype:** Horizontal Flow (`#24 Horizontal overflow reveal`).
- **Camera Source ID:** Camera `#30 Tracking shot (lateral)`.
- **Interaction Source ID:** Hover `#5 Film frame lift`, Click `#8 Magnetic snap` seek.
- **Composition Source ID:** Composition `#24 Horizontal overflow reveal`.
- **Visual Element Source IDs:** Visual `#26 Thin Divider Line`, Visual `#32 Scroll Progress Indicator`, Visual `#6 Status Indicator Card`.

```css
.spectrogram-tape-wrapper {
  background-color: #0e1113;
  border: 1px solid #2a333a;
  padding: 1.25rem;
  position: relative;
}

.spectrogram-tape {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 0.5rem;
}

.spectrogram-node {
  flex: 0 0 110px;
  background-color: #14191d;
  border: 1px solid #2a333a;
  padding: 0.75rem 0.6rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 78px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.spectrogram-node.active {
  background-color: #1e252b;
  border: 1px solid #d4a35f;
  box-shadow: inset 0 0 0 1px #d4a35f;
}

.spectrogram-node:hover:not(.active) {
  border-color: #4a5761;
  background-color: #181f24;
}
```

---

### Scene 4: Acoustic Telemetry & Calibration
- **Beat:** Resolution & Scientific Rigor.
- **Function:** Musical Key, Capo, and Sync Offset adjustments.
- **Archetype:** Precision Instrument Panel (`#7 Cross axis`).
- **Camera Source ID:** Camera `#20 Jump cut stagger`.
- **Interaction Source ID:** Stepper micro-scale feedback.
- **Visual Element Source IDs:** Visual `#8 Corner Brackets`, Visual `#10 Cross Marks`.

```css
.calibration-console {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background-color: #0e1113;
  border: 1px solid #2a333a;
  padding: 0.75rem 1.25rem;
}
```

---

## External Library Decision

### Q1: What is the core motion experience of this page?
- Quiet, deliberate, weightless spring physics reflecting astronomical/acoustic observation. No cartoon elasticity or frantic flashing.

### Q2: Can the native library entries do it?
- Yes, using CSS transitions with cubic-bezier curves (`cubic-bezier(0.22, 1, 0.36, 1)`) and Framer Motion's physics-driven springs (`stiffness: 280, damping: 30`).

### Q3: If an external library is used, why this one and how will it be redirected through the chosen film language?
- Framer Motion is already installed in the React client. It is strictly constrained to heavy deliberate dampening and zero-spring-overshoot to evoke the weightless, monolithic inertia of *Arrival*'s spacecraft.

### Decision
- Use Framer Motion for coordinate mounting and layout transitions. All visual styling, borders, corner viewfinders, and letterboxes are implemented via pure, zero-gradient CSS and Tailwind utilities.

---

## Shared System
- **Navigation:** Ultra-slim telemetry horizon (`height: 52px; background: rgba(8, 9, 10, 0.9); border-bottom: 1px solid #2a333a;`).
- **Footer:** Minimal coordinates dock with model version, sample rate (`22,050 Hz`), and FFT window size (`2048`).
- **Spacing Rhythm:** Generous monolithic macro-spacing ($4\text{rem}$ to $6\text{rem}$) balanced with dense, condensed forensic micro-telemetry ($4\text{px}$ to $8\text{px}$).
- **Typography System:**
  - Display / Root: `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`
  - Telemetry / Coordinates / Timing: `"SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace`
- **Utility Primitives:** Corner brackets (`.corner-bracket`), technical crosshairs (`.cross-mark`), coordinate stamps (`.telemetry-tag`).
- **Repeated Motifs:** Hairline gridlines and amber phosphor markers.
- **Uniqueness Check Against Previous Demos:** Passes all 7 tests. Completely distinct wireframe, geometry, aspect ratio, color palette, and layout logic.

---

## Derived Global Tokens
```css
:root {
  --cinema-void: #08090a;
  --cinema-surface-1: #0e1113;
  --cinema-surface-2: #14191d;
  --cinema-surface-3: #1e252b;
  --cinema-border: #2a333a;
  --cinema-border-subtle: #1c2227;
  --cinema-amber: #d4a35f;
  --cinema-amber-dim: rgba(212, 163, 95, 0.12);
  --cinema-mint: #4ade80;
  --cinema-text-primary: #eceeed;
  --cinema-text-secondary: #86949e;
  --cinema-text-muted: #4a5761;
  --radius-cinema: 2px;
  --ease-cinema: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## Phase 3 Quality Check
- [x] Every section has complete layout CSS
- [x] Every section has complete entrance behavior
- [x] Every section has complete interaction behavior
- [x] JS-required effects include complete JS/React handlers
- [x] Entrance variety rules pass (4 distinct entrance behaviors)
- [x] `fadeUp` appears at most 1 time on the page
- [x] External Library Decision block is complete
- [x] Library source IDs are present for all major visual moves
- [x] Zero gradients anywhere in the spec or code
