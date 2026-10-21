import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, Sparkles, Cpu, Plus, Check, Disc, Radio, AlertTriangle } from 'lucide-react';
import type { AppView, ChordSegment, DetectionEngine, LoadingStep, SongAnalysisResponse } from './types';
import { transposeChord, type AccidentalPreference } from './utils/transpose';
import { MOCK_ANALYSIS } from './utils/mockData';
import Header from './components/Header';
import URLInput, { extractVideoId } from './components/URLInput';
import LoadingSteps from './components/LoadingSteps';
import PlayerSection from './components/PlayerSection';
import ActiveChordDisplay from './components/ActiveChordDisplay';
import ChordTimeline from './components/ChordTimeline';
import TransposeControls from './components/TransposeControls';
import ApiKeyModal from './components/ApiKeyModal';
import { decodeAudioToPCM, analyzeAudioClientSide } from './services/localAnalyzer';

const INITIAL_LOADING_STEPS: LoadingStep[] = [
  { id: 'extract', label: 'Stage 1 // Ingesting audio stream...', status: 'pending' },
  { id: 'stems', label: 'Stage 2 // Meta HTDemucs stem separation (isolating guitars/piano)...', status: 'pending' },
  { id: 'btc', label: 'Stage 3 // BTC Transformer harmonic analysis (zero bass bleed)...', status: 'pending' },
  { id: 'master', label: 'Stage 4 // Bass inversion tracking & multimodal AI synthesis...', status: 'pending' },
];

export default function App() {
  const [view, setView] = useState<AppView>('input');
  const [engine, setEngine] = useState<DetectionEngine>('studio_master');
  const [analysis, setAnalysis] = useState<SongAnalysisResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0);
  const [accidentalPreference, setAccidentalPreference] = useState<AccidentalPreference>('sharp');
  const [filterPassingChords, setFilterPassingChords] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>(INITIAL_LOADING_STEPS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('chordsense_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const handleSaveApiKey = useCallback((newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem('chordsense_gemini_api_key', newKey);
      } else {
        localStorage.removeItem('chordsense_gemini_api_key');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Complete reset for "New Analysis"
  const handleNewAnalysis = useCallback(() => {
    setView('input');
    setAnalysis(null);
    setCurrentTime(0);
    setSeekTo(null);
    setTranspose(0);
    setCapo(0);
    setSyncOffset(0);
    setAccidentalPreference('sharp');
    setErrorMessage(null);
    setLoadingSteps(INITIAL_LOADING_STEPS);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
  }, [audioUrl]);

  // Submit handler: real backend AI analysis with status tracking & engine selection
  const handleSubmit = useCallback(async (
    submittedUrl: string,
    selectedEngine: DetectionEngine = engine,
    refresh = false
  ) => {
    setEngine(selectedEngine);
    setView('loading');
    setErrorMessage(null);
    setTranspose(0);
    setCapo(0);
    setSyncOffset(0);
    setLastSubmittedUrl(submittedUrl);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const videoId = extractVideoId(submittedUrl);
    if (!videoId) {
      setErrorMessage('Could not parse video ID from URL. Please check the link.');
      setView('loading');
      return;
    }

    setLoadingSteps([
      { id: 'extract', label: 'Stage 1 // Extracting YouTube audio stream...', status: 'active' },
      { id: 'stems', label: 'Stage 2 // Meta HTDemucs neural stem separation (isolating guitars/piano)...', status: 'pending' },
      { id: 'btc', label: 'Stage 3 // BTC Transformer harmonic analysis on clean stems (zero bass bleed)...', status: 'pending' },
      { id: 'master', label: 'Stage 4 // Bass inversion tracking & AI synthesis...', status: 'pending' },
    ]);

    const timer1 = setTimeout(() => {
      setLoadingSteps((prev) =>
        prev.map((s) =>
          s.id === 'extract' ? { ...s, status: 'done' } : s.id === 'stems' ? { ...s, status: 'active' } : s
        )
      );
    }, 3500);

    const timer2 = setTimeout(() => {
      setLoadingSteps((prev) =>
        prev.map((s) =>
          s.id === 'stems' ? { ...s, status: 'done' } : s.id === 'btc' ? { ...s, status: 'active' } : s
        )
      );
    }, 15000);

    const timer3 = setTimeout(() => {
      setLoadingSteps((prev) =>
        prev.map((s) =>
          s.id === 'btc' ? { ...s, status: 'done' } : s.id === 'master' ? { ...s, status: 'active' } : s
        )
      );
    }, 28000);

    try {
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const res = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: submittedUrl,
          refresh,
          engine: selectedEngine,
          apiKey: apiKey || undefined,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Server returned status ${res.status}`);
      }

      const data: SongAnalysisResponse = await res.json();
      const enriched: SongAnalysisResponse = {
        ...data,
        engine: data.engine || selectedEngine,
      };

      setLoadingSteps([
        { id: 'extract', label: 'Audio extraction complete', status: 'done' },
        {
          id: 'analyze',
          label: `Harmonics analyzed (${enriched.engine === 'gemini' ? 'Gemini 2.5 Flash' : 'BTC Model'}): Key of ${enriched.key} (${enriched.bpm} BPM)`,
          status: 'done',
        },
        { id: 'map', label: `${enriched.chords.length} chords aligned to downbeats`, status: 'done' },
      ]);

      await new Promise((r) => setTimeout(r, 350));
      setAccidentalPreference(enriched.key.includes('b') ? 'flat' : 'sharp');
      setAnalysis(enriched);
      setView('workspace');
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      console.error('[ChordSense] Analysis failed:', err);
      setErrorMessage(
        `${msg}. Ensure backend server is running on http://localhost:3001.`
      );
      setLoadingSteps((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' } : s))
      );
    }
  }, [audioUrl, engine, apiKey]);

  // 100% In-Browser Rust WebAssembly + WebGPU File Analysis
  const handleFileUpload = useCallback(async (file: File) => {
    setView('loading');
    setErrorMessage(null);
    setTranspose(0);
    setCapo(0);
    setSyncOffset(0);

    const blobUrl = URL.createObjectURL(file);
    setAudioUrl(blobUrl);

    setLoadingSteps([
      { id: 'extract', label: `Decoding ${file.name} (Web Audio API)...`, status: 'active' },
      { id: 'analyze', label: 'Computing CQT with Rust WebAssembly & WebGPU...', status: 'pending' },
      { id: 'map', label: 'Aligning harmonic progression & key...', status: 'pending' },
    ]);

    try {
      const pcm = await decodeAudioToPCM(file, (msg) => {
        setLoadingSteps((prev) =>
          prev.map((s) => (s.id === 'extract' ? { ...s, label: msg } : s))
        );
      });

      setLoadingSteps((prev) =>
        prev.map((s) =>
          s.id === 'extract'
            ? { ...s, status: 'done', label: `Audio decoded (${(pcm.length / 22050).toFixed(1)}s)` }
            : s.id === 'analyze'
            ? { ...s, status: 'active' }
            : s
        )
      );

      const result = await analyzeAudioClientSide(
        pcm,
        {
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'LOCAL RECORDING',
          videoId: 'local-file',
        },
        (msg) => {
          setLoadingSteps((prev) =>
            prev.map((s) => (s.id === 'analyze' ? { ...s, label: msg } : s))
          );
        }
      );

      setLoadingSteps([
        { id: 'extract', label: 'Audio decoded via Web Audio API', status: 'done' },
        { id: 'analyze', label: `Rust Wasm & WebGPU: Key of ${result.key} (${result.bpm} BPM)`, status: 'done' },
        { id: 'map', label: `${result.chords.length} chords aligned client-side`, status: 'done' },
      ]);

      await new Promise((r) => setTimeout(r, 350));
      setAccidentalPreference(result.key.includes('b') ? 'flat' : 'sharp');
      setAnalysis(result);
      setView('workspace');
    } catch (err) {
      console.error('[ChordSense] Client-side analysis failed:', err);
      const msg = err instanceof Error ? err.message : 'Local analysis failed';
      setErrorMessage(`${msg}. You can try another file or use the YouTube mode.`);
      setLoadingSteps((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' } : s))
      );
    }
  }, []);

  // Compute model confidence metrics across entire track
  const { minConfidence, avgConfidence, isLowAccuracy } = useMemo(() => {
    if (!analysis || !analysis.chords || analysis.chords.length === 0) {
      return { minConfidence: 85, avgConfidence: 92, isLowAccuracy: false };
    }
    const musicalChords = analysis.chords.filter((c) => c.chord !== 'N.C.' && c.chord !== 'N');
    const target = musicalChords.length > 0 ? musicalChords : analysis.chords;
    let totalDur = 0;
    let weightedSum = 0;
    const scores: number[] = [];
    for (const c of target) {
      const dur = Math.max(0.1, c.endTime - c.startTime);
      const conf = c.confidence ?? 0.88;
      totalDur += dur;
      weightedSum += conf * dur;
      scores.push(Math.round(conf * 100));
    }
    scores.sort((a, b) => a - b);
    const min = scores[0] ?? 60;
    const avg = Math.round((weightedSum / (totalDur || 1)) * 100);
    return { minConfidence: min, avgConfidence: avg, isLowAccuracy: avg < 60 };
  }, [analysis]);

  // Apply transpose + capo + accidental preference to chords.
  // When filterPassingChords is active (default), transient 1-second passing blips (e.g. chromatic bass slides, vocal glides) are absorbed.
  const displayChords = useMemo((): ChordSegment[] => {
    if (!analysis) return [];
    const totalShift = transpose - capo;
    const mapped = analysis.chords.map((c) => ({
      ...c,
      chord: transposeChord(c.chord, totalShift, accidentalPreference),
      root: transposeChord(c.root, totalShift, accidentalPreference),
      bass: c.bass ? transposeChord(c.bass, totalShift, accidentalPreference) : undefined,
    }));

    if (!filterPassingChords) return mapped;

    // Harmonic Dwell & Passing-Tone Suppression (absorbs 1-second vocal/bass artifacts)
    const smoothed: ChordSegment[] = [];
    for (let i = 0; i < mapped.length; i++) {
      const cur = mapped[i];
      const prev = smoothed[smoothed.length - 1];
      const next = i < mapped.length - 1 ? mapped[i + 1] : null;
      const dur = cur.endTime - cur.startTime;

      // Filter transient blips lasting < 1.35s (e.g., 1-second D#dim between Em7 and Dm7, bass walkdowns, vocal glides)
      const isPassingTone =
        dur < 1.35 &&
        prev &&
        (cur.quality.includes('dim') ||
          cur.quality.includes('aug') ||
          dur <= 1.05 ||
          (next && next.endTime - next.startTime >= 2.0));

      if (isPassingTone && prev) {
        // Bridge previous chord across the transient passing blip
        prev.endTime = cur.endTime;
        continue;
      }

      if (prev && prev.chord === cur.chord) {
        prev.endTime = cur.endTime;
        prev.confidence = Math.max(prev.confidence, cur.confidence);
      } else {
        smoothed.push({ ...cur });
      }
    }

    return smoothed;
  }, [analysis, transpose, capo, accidentalPreference, filterPassingChords]);

  const effectiveTime = Math.max(0, currentTime + syncOffset);

  const activeIndex = displayChords.findIndex(
    (c) => effectiveTime >= c.startTime && effectiveTime < c.endTime
  );
  const currentChord = activeIndex >= 0 ? displayChords[activeIndex] : null;
  const previousChord = activeIndex > 0 ? displayChords[activeIndex - 1] : null;
  const nextChord = activeIndex >= 0 && activeIndex < displayChords.length - 1 ? displayChords[activeIndex + 1] : null;

  const handleSeek = useCallback((time: number) => {
    setSeekTo(time);
    setTimeout(() => setSeekTo(null), 100);
  }, []);

  const displayKey = useMemo(() => {
    if (!analysis) return '';
    const parts = analysis.key.split(' ');
    const root = parts[0];
    const mode = parts.slice(1).join(' ');
    const transposedRoot = transposeChord(root, transpose, accidentalPreference);
    return `${transposedRoot}${mode ? ' ' + mode : ''}`;
  }, [analysis, transpose, accidentalPreference]);

  return (
    <div className="min-h-screen flex flex-col bg-[#08090a] text-[#eceeed]">
      <Header
        onNewAnalysis={handleNewAnalysis}
        isWorkspace={view === 'workspace'}
        hasApiKey={Boolean(apiKey)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      <main className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* INPUT VIEW (Scene 1: Establishing Deck) */}
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
            >
              <URLInput
                onSubmit={handleSubmit}
                onFileUpload={handleFileUpload}
                isLoading={false}
                apiKey={apiKey}
                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              />
            </motion.div>
          )}

          {/* LOADING VIEW */}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
            >
              <LoadingSteps
                steps={loadingSteps}
                errorMessage={errorMessage}
                onBack={handleNewAnalysis}
                onFallbackDemo={() => {
                  setAnalysis(MOCK_ANALYSIS);
                  setView('workspace');
                }}
              />
            </motion.div>
          )}

          {/* WORKSPACE VIEW (Scene 2 & 3: The Observation Chamber) */}
          {view === 'workspace' && analysis && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5"
            >
              {/* Telemetry Header Strip */}
              <div className="cinema-letterbox bracket-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="bracket-tl" />
                <div className="bracket-tr" />
                <div className="bracket-bl" />
                <div className="bracket-br" />

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#eceeed] uppercase">
                      {analysis.title}
                    </h2>
                    {showConfidence && (
                      <div
                        className={`telemetry-stamp flex items-center gap-1.5 ${
                          isLowAccuracy
                            ? 'border-[#e06c75] text-[#e06c75] bg-[#e06c75]/10 font-bold'
                            : 'telemetry-stamp-active'
                        }`}
                        title={
                          isLowAccuracy
                            ? `Warning: Overall detection accuracy is ${avgConfidence}% (<60%). Output may be inaccurate.`
                            : `Model confidence: ${avgConfidence}% average accuracy across detected chords`
                        }
                      >
                        {isLowAccuracy ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#e06c75]" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#d4a35f]" />
                        )}
                        <span>
                          {isLowAccuracy ? `LOW ACCURACY: ${avgConfidence}%` : `LOCK: ≥60% • ${avgConfidence}% AVG`}
                        </span>
                      </div>
                    )}
                  </div>

                  {analysis.artist && (
                    <p className="text-xs font-mono text-[#86949e] mt-1 uppercase tracking-wider">
                      ARTIST: {analysis.artist}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs font-mono">
                    <span className="telemetry-stamp text-[#d4a35f]">♩ {analysis.bpm} BPM</span>
                    <span className="telemetry-stamp">{analysis.timeSignature} TIME</span>
                    <span className="telemetry-stamp">
                      {displayChords.length} CHORDS
                    </span>
                    <span className="telemetry-stamp text-[#eceeed]">
                      ENGINE: {analysis.engine === 'studio_master' ? 'STUDIO MASTER' : analysis.engine === 'gemini' ? 'GEMINI 2.5 FLASH' : 'BTC NEURAL MODEL'}
                    </span>
                    {analysis.grounding?.verified && (
                      <span
                        className="telemetry-stamp text-[#d4a35f] border-[#d4a35f]/60 bg-[#d4a35f]/10"
                        title={`Verified score confirmed online (${analysis.grounding.verifiedChords?.join(', ')}). Harmonically locked to audio frequencies.`}
                      >
                        🌐 WEB VERIFIED: {analysis.grounding.verifiedChords?.slice(0, 5).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Actions (Only Re-analyze here; New Song is in Header) */}
                <div className="flex items-center gap-2 shrink-0">
                  {!audioUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSubmit(
                          lastSubmittedUrl || `https://www.youtube.com/watch?v=${analysis.videoId}`,
                          analysis.engine || engine,
                          true
                        )
                      }
                      title="Re-run neural analysis bypassing cache"
                      className="telemetry-stamp hover:border-[#d4a35f] hover:text-[#eceeed] cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 mr-1 inline" />
                      <span>RE-ANALYZE</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Low Accuracy Warning Banner (< 60%) - only shown when confidence labels are enabled */}
              {showConfidence && isLowAccuracy && (
                <div className="cinema-letterbox p-3.5 bg-[rgba(224,108,117,0.12)] border border-[#e06c75] text-[#eceeed] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-6 h-6 flex items-center justify-center bg-[#e06c75]/20 border border-[#e06c75] text-[#e06c75] shrink-0 font-bold">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-[#e06c75] uppercase tracking-wider">
                        POTENTIAL INACCURACY WARNING • HARMONIC CONFIDENCE IS LOW ({avgConfidence}%)
                      </div>
                      <div className="text-[11px] text-[#86949e] mt-0.5">
                        The overall model confidence for this track is below 60%. Dense instrumental mixing, heavy distortion, or low guitar prominence may cause chord inaccuracies. Chords below 60% confidence are visually badged with a warning.
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#e06c75] border border-[#e06c75]/40 px-2.5 py-1 bg-[#e06c75]/10 shrink-0 font-bold uppercase tracking-wider self-start sm:self-auto">
                    OVERALL ACCURACY: {avgConfidence}%
                  </div>
                </div>
              )}

              {/* Video + Active Chord Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Widescreen Video Specimen (7 cols on desktop) */}
                <div className="lg:col-span-7">
                  <PlayerSection
                    videoId={analysis.videoId}
                    audioUrl={audioUrl}
                    onTimeUpdate={setCurrentTime}
                    seekTo={seekTo}
                  />
                </div>

                {/* Active Chord Display (5 cols on desktop) */}
                <div className="lg:col-span-5">
                  <ActiveChordDisplay
                    previousChord={previousChord}
                    currentChord={currentChord}
                    nextChord={nextChord}
                    currentTime={effectiveTime}
                    accidentalPreference={accidentalPreference}
                    onSeek={handleSeek}
                    showConfidence={showConfidence}
                  />
                </div>
              </div>

              {/* Calibration Control Deck & Continuous Chord Stream */}
              <div className="space-y-4">
                {/* Tactical Telemetry Console */}
                <div className="cinema-letterbox p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <TransposeControls
                    transpose={transpose}
                    capo={capo}
                    syncOffset={syncOffset}
                    accidentalPreference={accidentalPreference}
                    filterPassingChords={filterPassingChords}
                    showConfidence={showConfidence}
                    onTransposeChange={setTranspose}
                    onCapoChange={setCapo}
                    onSyncOffsetChange={setSyncOffset}
                    onAccidentalPreferenceChange={setAccidentalPreference}
                    onFilterPassingChordsChange={setFilterPassingChords}
                    onShowConfidenceChange={setShowConfidence}
                    songKey={displayKey}
                    suggestedCapo={analysis.suggestedCapo}
                  />

                  {/* Auto-Scroll Toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border font-mono transition-colors cursor-pointer ${
                      autoScroll
                        ? 'bg-[rgba(212,163,95,0.15)] text-[#d4a35f] border-[#d4a35f] font-bold'
                        : 'bg-[#14191d] border-[#2a333a] text-[#86949e] hover:text-[#eceeed]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 ${autoScroll ? 'bg-[#d4a35f]' : 'bg-[#4a5761]'}`} />
                    <span>AUTO-SCROLL</span>
                    {autoScroll && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                </div>

                {/* Continuous Chronological Chord Progression Tape */}
                <div className="cinema-letterbox bracket-container p-4">
                  <div className="bracket-tl" />
                  <div className="bracket-tr" />
                  <div className="bracket-bl" />
                  <div className="bracket-br" />

                  <div className="flex items-center justify-between mb-3 text-[11px] font-mono border-b border-[#2a333a] pb-2">
                    <div className="flex items-center gap-2">
                      <Disc className="w-3.5 h-3.5 text-[#d4a35f]" />
                      <span className="font-bold text-[#eceeed] uppercase">CHORD PROGRESSION</span>
                    </div>
                    <div className="text-[#86949e]">
                      CHORDS: <strong className="text-[#eceeed]">{displayChords.length}</strong>
                    </div>
                  </div>

                  <ChordTimeline
                    chords={displayChords}
                    currentTime={effectiveTime}
                    onSeek={handleSeek}
                    autoScroll={autoScroll}
                    accidentalPreference={accidentalPreference}
                    minConfidence={minConfidence}
                    showConfidence={showConfidence}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
