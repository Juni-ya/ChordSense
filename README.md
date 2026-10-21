# 🎸 ChordSense

An advanced, studio-grade YouTube chord identifier powered by the **Studio Master Pipeline**: combining **Meta AI's Hybrid Transformer Demucs (HTDemucs)** source separation, the **BTC (Bidirectional Transformer for Musical Chord Recognition)** neural network, physical **Bass Stem Pitch Extraction**, and multimodal AI chord verification.

Paste any YouTube URL or drop a local audio file, and ChordSense isolates the musical stems, detects rich chord progressions with millisecond transient accuracy, and syncs chords alongside video playback.

---

## 🚀 Key Features

* **Studio Master Pipeline (Meta HTDemucs Neural Separation):**
  Splits full-mix songs into clean isolated audio stems (`guitars/keys`, `bass`, `drums`, `vocals`). Running harmonic recognition on the isolated guitar and piano stem completely eliminates walking bassline flickers, drum transients, and vocal interference.
* **Trained Deep Learning Model (BTC Transformer):**
  Uses the pre-trained **BTC Transformer** via ONNX Runtime (`btc.onnx`) for tight 0.09s acoustic transient downbeat locking.
* **Physical Bass Inversion Tracking:**
  Analyzes the isolated bass fundamental ($F_0$) to identify authentic slash chords ($G/B, C/E, D/F\#$).
* **Harmonic Dwell & Chromatic Passing-Tone Filter:**
  Automatically filters out transient half-step chromatic slides and vocal glides ($< 1.35\text{s}$) to produce clean, professional rhythm charts.
* **Denis Villeneuve *Arrival*-Inspired Aesthetic:**
  Minimalist brutalist monochrome aesthetic with high-contrast amber telemetry accents, bracket frames, and real-time playback synchronization.
* **Interactive Player Controls:**
  Interactive transposing ($\pm 12$ semitones), Enharmonic toggle ($\sharp$ Sharp vs $\flat$ Flat), Capo calculation, and Micro-timing sync adjustment ($\pm 0.2\text{s}$).

---

## 🏗️ Architecture

```
client/          → React 18 + Vite + TypeScript + Tailwind CSS (Vercel Ready)
server/          → Express + TypeScript + Demucs + ONNX Runtime (Render/Railway Ready)
  ├── models/btc.onnx                  (Pre-trained 4.9MB BTC Transformer)
  ├── scripts/separate_stems.py        (Meta HTDemucs stem separation runner)
  ├── src/services/stemSeparator.ts    (Audio stem caching & isolation orchestrator)
  ├── src/services/studioMasterAnalyzer.ts (4-stage Studio Master synthesis)
  ├── src/services/bassTracker.ts      (Low-frequency bass fundamental tracker)
  ├── src/services/btcAnalyzer.ts      (CQT + ONNX inference on clean stems)
  └── src/services/tabRetriever.ts     (Verified score grounding)
```

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

## 🌐 Deployment Guide

### Step 1: Deploy Backend (Render.com / Railway / Docker)
1. Push your repository to GitHub.
2. In Render / Railway, create a new Web Service pointing to `server/`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set environment variables:
   * `PORT` = `3001`
   * `GEMINI_API_KEY` = your Google AI key (optional, for multimodal synthesis)

### Step 2: Deploy Frontend to Vercel
1. Import repository into Vercel pointing to the `client/` root.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable:
   * `VITE_API_URL` = `https://your-backend.onrender.com`

---

## 📄 License
MIT License.
