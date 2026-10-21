# 🎸 ChordSense

A YouTube chord identifier that isolates rhythm instruments, detects harmonic progressions, and syncs guitar and piano chords alongside video playback.

Paste a YouTube link or upload an audio file, and ChordSense isolates the rhythm instruments, detects chord progressions, and syncs chords alongside video playback.

---

## 🚀 Key Features

* **Stem Separation & Instrument Isolation (Meta HTDemucs):**
  Splits full-mix songs into isolated audio stems (`guitars/keys`, `bass`, `drums`, `vocals`). Running harmonic recognition on the isolated guitar and piano stem helps eliminate walking bassline flickers, drum transients, and vocal interference.
* **Trained Deep Learning Model (BTC Transformer):**
  Uses the pre-trained **BTC Transformer** via ONNX Runtime (`btc.onnx`) for tight acoustic transient downbeat locking.
* **Physical Bass Inversion Tracking:**
  Analyzes the isolated bass fundamental ($F_0$) to identify authentic slash chords (G/B, C/E, D/F\#).
* **Harmonic Dwell & Chromatic Passing-Tone Filter:**
  Automatically filters out transient half-step chromatic slides and vocal glides ($< 1.35\text{s}$) to produce clean, professional rhythm charts.
* **Interactive Player Controls:**
  Interactive transposing ($\pm 12$ semitones), Enharmonic toggle ($\sharp$ Sharp vs $\flat$ Flat), Capo calculation, and Micro-timing sync adjustment ($\pm 0.2\text{s}$).

---

## ⚠️ Recommended Songs & Limitations

* **Expected Accuracy (~80%–85% on Rhythm Tracks):**
  ChordSense typically achieves **80%–85% accuracy** on clean rhythm guitar and acoustic piano tracks with clear strumming or chordal comping. Complex arrangements, dense mixing, or low instrument presence will reduce detection accuracy.

* **Major vs. Minor Chord Confusion:**
  The detection model can occasionally confuse **Major and Minor chords** sharing the same root note (for example, detecting $B\text{m}$ instead of $B\text{ Major}$, or $C$ instead of $C\text{m}$). This primarily happens when vocal lines, blues notes, or bass overtones introduce notes outside the underlying chord (such as a vocal minor third sung over a major chord), or when chords are played with open/suspended voicings.

* **Not Recommended for Electronic Music:**
  It is **not recommended** to input electronic music (EDM, synthwave, techno), heavily modulated synthesizer pads, detuned 808 sub-bass glides, or ambient soundscapes. Synthetic modulation, heavy sidechain pumping, and non-harmonic frequency sweeps will confuse the chord detection pipeline.

---

## 📐 Architecture & Whiteboard Explanation
For an in-depth whiteboard breakdown of the complete audio pipeline, neural model processing, bass pitch tracking, and frontend synchronization, see [WHITEBOARD.md](WHITEBOARD.md).

---

## 🛠️ Local Development

### Prerequisites
* **Node.js 18+**
* **Python 3.10+** (with PyTorch and `demucs` installed)
* **yt-dlp** installed and available in PATH (or configured in `server/.env`)

### 1. Server Setup
```bash
cd server
npm install
npm run build
npm start
```
The server will run on `http://localhost:3001`.

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📄 License
MIT License.
