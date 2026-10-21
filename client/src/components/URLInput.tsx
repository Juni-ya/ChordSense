import { useState, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Clipboard, Play, Upload, FileAudio, Youtube, Sparkles, Key, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { DEMO_VIDEOS } from '../utils/mockData';
import type { DetectionEngine } from '../types';

interface URLInputProps {
  onSubmit: (url: string, engine: DetectionEngine) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  apiKey?: string;
  onOpenApiKeyModal?: () => void;
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

export default function URLInput({
  onSubmit,
  onFileUpload,
  isLoading,
  apiKey,
  onOpenApiKeyModal,
}: URLInputProps) {
  const [tab, setTab] = useState<'youtube' | 'file'>('youtube');
  const [url, setUrl] = useState('');
  const [engine, setEngine] = useState<DetectionEngine>('studio_master');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      onOpenApiKeyModal?.();
      return;
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube link');
      return;
    }
    setError('');
    onSubmit(url, engine);
  };

  const handlePaste = async () => {
    if (!apiKey) return;
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDemo = (videoId: string) => {
    if (!apiKey) {
      onOpenApiKeyModal?.();
      return;
    }
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
        setError('Unsupported audio format. Please upload an MP3, WAV, M4A, or FLAC file.');
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
      {/* Letterbox Frame */}
      <div className="cinema-letterbox bracket-container p-6 sm:p-10">
        <div className="bracket-tl" />
        <div className="bracket-tr" />
        <div className="bracket-bl" />
        <div className="bracket-br" />

        {/* Central Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="telemetry-stamp telemetry-stamp-active">
              CHORDSENSE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#eceeed] mb-2 uppercase">
            Identify Guitar & Piano Chords
          </h1>
          <p className="text-[#86949e] text-sm sm:text-base font-normal max-w-lg mx-auto">
            Paste a YouTube link or upload an audio file to view synchronized chords.
          </p>
          <p className="text-[#657683] text-xs font-mono mt-2 max-w-lg mx-auto">
            💡 Best results on rhythm guitar and acoustic piano (~80-85% accuracy). Note: output may occasionally confuse Major and Minor chords with strong vocal melodies. Not recommended for electronic music or heavy distortion.
          </p>
        </div>

        {/* Mode Selector */}
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
              <span>YOUTUBE URL</span>
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
              <span>AUDIO FILE</span>
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
              {/* Detection Engine Selector */}
              <div className="mb-6 border border-[#2a333a] bg-[#0c0f11] p-3 sm:p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e252b] text-[10px] font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-2 text-[#eceeed]">
                    <Sparkles className="w-4 h-4 text-[#d4a35f]" />
                    <span className="font-bold text-xs tracking-wider">DETECTION ENGINE</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#86949e]">
                    <span className="text-[#d4a35f] font-bold">
                      {engine === 'studio_master' ? 'FULL PIPELINE' : 'FAST PREVIEW'}
                    </span>
                  </div>
                </div>

                {/* Primary Mode: Full Analysis (Demucs + BTC + Bass Tracker) */}
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
                          ★ FULL ANALYSIS (STEM SEPARATION &amp; BASS TRACKING)
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-[#d4a35f] text-black font-extrabold uppercase tracking-widest">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-[#a2b0b9] leading-relaxed mb-4">
                      Isolates guitars and piano from basslines and drums using Meta HTDemucs, tracks true bass roots for slash chords ($G/B, C/E$), and filters out passing tone blips.
                    </p>

                    {/* 4-Stage Flowchart */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#1e252b] text-[10px] font-mono">
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 1</span>
                        <span className="text-[#eceeed] font-medium block">Stem Separation</span>
                        <span className="text-[#657683] text-[9px]">Isolates guitar &amp; piano</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 2</span>
                        <span className="text-[#eceeed] font-medium block">Chord Detection</span>
                        <span className="text-[#657683] text-[9px]">Aligns to rhythm</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 3</span>
                        <span className="text-[#eceeed] font-medium block">Bass Tracking</span>
                        <span className="text-[#657683] text-[9px]">Detects bass notes</span>
                      </div>
                      <div className="p-2 bg-[#090c0e] border border-[#1e252b]">
                        <span className="text-[#d4a35f] block font-bold mb-0.5">STAGE 4</span>
                        <span className="text-[#eceeed] font-medium block">Refinement</span>
                        <span className="text-[#657683] text-[9px]">Verifies chords</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Instant Test Toggle */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#86949e] px-1">
                    <span className="text-[11px]">Need a quick 3-second result instead?</span>
                    <button
                      type="button"
                      onClick={() => setEngine(engine === 'btc' ? 'studio_master' : 'btc')}
                      className="text-[#d4a35f] hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      {engine === 'btc' ? '← Switch to Full Analysis' : '⚡ Quick Preview (Fast)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Highly Visible API Key Card */}
              {!apiKey ? (
                <div className="mb-4 p-4 bg-[#141009] border-2 border-[#d4a35f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-[0_0_25px_rgba(212,163,95,0.15)]">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#d4a35f]/20 border border-[#d4a35f] flex items-center justify-center shrink-0 text-[#d4a35f]">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#d4a35f] text-sm uppercase tracking-wider flex items-center gap-2">
                        <span>API KEY REQUIRED</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#d4a35f] text-black font-extrabold">REQUIRED TO UNLOCK</span>
                      </div>
                      <p className="text-[#a2b0b9] text-[11px] mt-0.5">
                        Please insert your Google Gemini API key. The YouTube input below unlocks immediately once entered.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={onOpenApiKeyModal}
                      className="px-4 py-2 bg-[#d4a35f] hover:bg-[#e5c07b] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 fill-black" />
                      <span>ENTER API KEY</span>
                    </button>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-[#2a333a] bg-[#08090a] text-[#86949e] hover:text-[#d4a35f] hover:border-[#d4a35f] transition-colors"
                      title="Get free API key at Google AI Studio"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-4 px-3.5 py-2.5 bg-[#0b120e] border border-[#22402c] flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#4ade80]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4ade80]" />
                    <span className="font-bold uppercase tracking-wider">GEMINI API KEY ACTIVE</span>
                    <span className="text-[#657683] text-[11px] font-mono hidden sm:inline">
                      ({apiKey.slice(0, 6)}••••••••)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenApiKeyModal}
                    className="text-[#86949e] hover:text-[#eceeed] hover:underline text-[11px] cursor-pointer"
                  >
                    Change Key
                  </button>
                </div>
              )}

              {/* YouTube URL Input Form (Greyed out if no API key) */}
              <form onSubmit={handleSubmit} className="relative">
                <div
                  className={`border transition-all flex items-center p-1.5 ${
                    !apiKey
                      ? 'bg-[#090b0d] border-[#1e252b] opacity-45 cursor-not-allowed select-none'
                      : 'bg-[#08090a] border-[#2a333a] focus-within:border-[#d4a35f]'
                  }`}
                  onClick={!apiKey ? onOpenApiKeyModal : undefined}
                >
                  <Link className={`w-4 h-4 ml-3 shrink-0 ${!apiKey ? 'text-[#35414b]' : 'text-[#4a5761]'}`} />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    placeholder={
                      !apiKey
                        ? 'Please enter your Gemini API key above to unlock...'
                        : 'Enter YouTube link (e.g. https://www.youtube.com/watch?v=...)'
                    }
                    className={`flex-1 bg-transparent px-3 py-2.5 font-mono text-xs sm:text-sm focus:outline-none ${
                      !apiKey
                        ? 'text-[#4a5761] placeholder:text-[#3f4b55] cursor-not-allowed'
                        : 'text-[#eceeed] placeholder:text-[#4a5761]'
                    }`}
                    disabled={isLoading || !apiKey}
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    disabled={isLoading || !apiKey}
                    className={`p-2 transition-colors ${
                      !apiKey
                        ? 'text-[#35414b] cursor-not-allowed'
                        : 'text-[#86949e] hover:text-[#eceeed] hover:bg-[#14191d] cursor-pointer'
                    }`}
                    title={!apiKey ? 'Enter API Key first' : 'Paste from clipboard'}
                    aria-label="Paste from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !apiKey || !url.trim()}
                    className={`px-5 py-2.5 font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 ${
                      !apiKey
                        ? 'bg-[#14191d] text-[#4a5761] border border-[#1e252b] cursor-not-allowed'
                        : !url.trim()
                        ? 'bg-[#14191d] text-[#4a5761] cursor-not-allowed'
                        : 'bg-[#d4a35f] hover:bg-[#e5c07b] text-black cursor-pointer'
                    }`}
                    title={!apiKey ? 'API Key required to unlock analysis' : undefined}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ANALYZE</span>
                  </button>
                </div>
              </form>

              {/* Sample Demo Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-mono text-[#4a5761] mr-1">TRY A DEMO:</span>
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
                  DROP AUDIO FILE OR <span className="text-[#d4a35f] underline">CHOOSE A FILE</span>
                </h2>
                <p className="text-xs font-mono text-[#86949e] max-w-sm mx-auto">
                  Supports MP3, WAV, M4A, and FLAC audio files
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
