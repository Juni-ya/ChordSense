import { useState, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Clipboard, Play, Upload, FileAudio, Youtube, Cpu, Compass, Sparkles, Zap } from 'lucide-react';
import { DEMO_VIDEOS } from '../utils/mockData';
import type { DetectionEngine } from '../types';

interface URLInputProps {
  onSubmit: (url: string, engine: DetectionEngine) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const last = pathParts[pathParts.length - 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(last)) {
        return last;
      }
    }
  } catch {
    // regex fallback
  }

  const match = trimmed.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export { extractVideoId };

export default function URLInput({ onSubmit, onFileUpload, isLoading }: URLInputProps) {
  const [tab, setTab] = useState<'youtube' | 'file'>('youtube');
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState<DetectionEngine>('studio_master');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('SIGNAL REJECTED: INVALID YOUTUBE URL FORMAT');
      return;
    }
    setError('');
    onSubmit(url, engine);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDemo = (videoId: string) => {
    const demoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    setUrl(demoUrl);
    setError('');
    onSubmit(demoUrl, engine);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i)) {
        setError('UNSUPPORTED AUDIO CODEC. REQUIRE MP3, WAV, M4A, OR FLAC.');
        return;
      }
      setError('');
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setError('');
      onFileUpload(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Station Coordinates & Telemetry Header */}
      <div className="mb-6 flex items-center justify-between text-[11px] font-mono text-[#86949e] border-b border-[#2a333a] pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#d4a35f]" />
          <span>DECK 01 // FREQUENCY INGEST</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SAMPLING: 22,050 HZ</span>
          <span>•</span>
          <span>ENGINE: {engine === 'studio_master' ? 'STUDIO MASTER (DEMUCS + BTC + BASS)' : 'FAST PREVIEW (BTC RAW)'}</span>
        </div>
      </div>

      {/* Anamorphic Letterbox Chamber Frame (#4 Letterbox Cinema) */}
      <div className="cinema-letterbox bracket-container p-6 sm:p-10">
        <div className="bracket-tl" />
        <div className="bracket-tr" />
        <div className="bracket-bl" />
        <div className="bracket-br" />

        {/* Central Monolithic Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="telemetry-stamp telemetry-stamp-active">
              ACOUSTIC SIGNAL DECODER
            </span>
            <span className="telemetry-stamp">
              RUST WASM ACTIVE
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#eceeed] mb-3 uppercase">
            Harmonic Decryption
          </h1>
          <p className="text-[#86949e] text-sm sm:text-base font-normal max-w-lg mx-auto">
            Input a video link or local audio recording to decompose its acoustic frequencies into real-time synchronized chord voicings.
          </p>
        </div>

        {/* Tactical Mode Segmented Switch */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-0.5 bg-[#08090a] border border-[#2a333a]">
            <button
              type="button"
              onClick={() => {
                setTab('youtube');
                setError('');
              }}
              className={`px-4 py-2 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                tab === 'youtube'
                  ? 'bg-[#1e252b] text-[#eceeed] border-b-2 border-[#d4a35f]'
                  : 'text-[#86949e] hover:text-[#eceeed]'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span>YOUTUBE STREAM</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('file');
                setError('');
              }}
              className={`px-4 py-2 text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                tab === 'file'
                  ? 'bg-[#1e252b] text-[#eceeed] border-b-2 border-[#d4a35f]'
                  : 'text-[#86949e] hover:text-[#eceeed]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#d4a35f]" />
              <span>LOCAL AUDIO BUFFER</span>
              <span className="text-[10px] text-[#4a5761]">(WASM)</span>
            </button>
          </div>
        </div>

        {/* Input Chamber Panels */}
        <AnimatePresence mode="wait">
          {tab === 'youtube' ? (
            <motion.div
              key="youtube-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Studio Master Architecture Controller (Denis Villeneuve Arrival cinematic telemetry) */}
              <div className="mb-6 border border-[#2a333a] bg-[#0c0f11] p-3 sm:p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e252b] text-[10px] font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-2 text-[#eceeed]">
                    <Sparkles className="w-4 h-4 text-[#d4a35f]" />
                    <span className="font-bold text-xs tracking-wider">STUDIO MASTER ACCURACY ENGINE</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#86949e]">
                    <span>STATUS: ARMED</span>
                    <span>•</span>
                    <span className="text-[#d4a35f] font-bold">
                      {engine === 'studio_master' ? 'STUDIO MASTER PIPELINE' : 'FAST PREVIEW'}
                    </span>
                  </div>
                </div>

                {/* Primary Mode: Studio Master (Demucs + BTC + Bass Tracker) */}
                <div className="space-y-3">
                  <div
                    onClick={() => setEngine('studio_master')}
                    className={`p-4 border transition-all cursor-pointer relative ${
                      engine === 'studio_master'
                        ? 'bg-[#141b21] border-[#d4a35f] shadow-[0_0_20px_rgba(212,163,95,0.15)]'
                        : 'bg-[#08090a] border-[#22292f] hover:border-[#35414b]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black tracking-wide text-[#eceeed]">
                          ★ STUDIO MASTER PIPELINE (MAXIMUM ACCURACY)
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-[#d4a35f] text-black font-extrabold uppercase tracking-widest">
                          ACTIVE
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#d4a35f] font-bold">
                        META HTDEMUCS + BTC + BASS TRACKER
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#a2b0b9] leading-relaxed mb-4">
                      Disregards speed limits to achieve 1:1 studio chord transcription. Runs Meta AI&apos;s Neural HTDemucs to isolate guitars/keys from the bassline and drums, runs the BTC Transformer on clean harmony, and tracks true physical bass roots for authentic slash chords ($G/B, C/E$).
                    </p>

                    {/* 4-Stage Architectural Flowchart */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#1e252b] text-[10px] font-mono">
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 1</span>
                        <span className="text-[#eceeed] font-medium block">Demucs Stems</span>
                        <span className="text-[#657683] text-[9px]">Zero bass bleed</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 2</span>
                        <span className="text-[#eceeed] font-medium block">BTC Harmonics</span>
                        <span className="text-[#657683] text-[9px]">0.09s transient lock</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 3</span>
                        <span className="text-[#eceeed] font-medium block">Bass Tracking</span>
                        <span className="text-[#657683] text-[9px]">G/B &amp; C/E inversions</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 4</span>
                        <span className="text-[#eceeed] font-medium block">AI Synthesis</span>
                        <span className="text-[#657683] text-[9px]">Rich 7th extensions</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Instant Test Toggle */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#86949e] px-1">
                    <span className="text-[11px]">Need instant 3-second result instead?</span>
                    <button
                      type="button"
                      onClick={() => setEngine(engine === 'btc' ? 'studio_master' : 'btc')}
                      className="text-[#d4a35f] hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      {engine === 'btc' ? '← Switch to Studio Master' : '⚡ Switch to Quick Preview (BTC Raw)'}
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <div className="bg-[#08090a] border border-[#2a333a] focus-within:border-[#d4a35f] transition-colors flex items-center p-1.5">
                  <Link className="w-4 h-4 text-[#4a5761] ml-3 shrink-0" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    placeholder="ENTER YOUTUBE SIGNAL URL..."
                    className="flex-1 bg-transparent px-3 py-2.5 text-[#eceeed] placeholder:text-[#4a5761] font-mono text-xs sm:text-sm focus:outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="p-2 text-[#86949e] hover:text-[#eceeed] hover:bg-[#14191d] transition-colors"
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="px-5 py-2.5 bg-[#d4a35f] hover:bg-[#e5c07b] disabled:bg-[#14191d] disabled:text-[#4a5761] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>DECODE</span>
                  </button>
                </div>
              </form>

              {/* Sample Telemetry Nodes */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-mono text-[#4a5761] mr-1">CALIBRATION SIGNALS:</span>
                {DEMO_VIDEOS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemo(demo.id)}
                    className="text-[11px] font-mono px-2.5 py-1 bg-[#14191d] hover:bg-[#1e252b] text-[#86949e] hover:text-[#eceeed] border border-[#2a333a] hover:border-[#d4a35f] transition-colors cursor-pointer"
                  >
                    [{demo.label.toUpperCase()}]
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                className="hidden"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`bg-[#08090a] border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#d4a35f] bg-[#14191d]'
                    : 'border-[#2a333a] hover:border-[#4a5761] hover:bg-[#0c0f11]'
                }`}
              >
                <div className="w-11 h-11 bg-[#14191d] border border-[#2a333a] text-[#d4a35f] flex items-center justify-center mx-auto mb-3">
                  <FileAudio className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-mono font-bold text-[#eceeed] mb-1 uppercase tracking-wide">
                  DROP AUDIO FILE OR <span className="text-[#d4a35f] underline">BROWSE LOCAL STORAGE</span>
                </h2>
                <p className="text-xs font-mono text-[#86949e] max-w-sm mx-auto">
                  100% IN-BROWSER EXECUTION VIA RUST CQT WEBASSEMBLY &amp; WEBGPU TENSORS
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
