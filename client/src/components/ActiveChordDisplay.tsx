import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ChordSegment } from '../types';
import { formatChordDisplay, type AccidentalPreference } from '../utils/transpose';

interface ActiveChordDisplayProps {
  previousChord: ChordSegment | null;
  currentChord: ChordSegment | null;
  nextChord: ChordSegment | null;
  currentTime: number;
  accidentalPreference?: AccidentalPreference;
  onSeek?: (time: number) => void;
  showConfidence?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveChordDisplay({
  previousChord,
  currentChord,
  nextChord,
  currentTime,
  accidentalPreference,
  onSeek,
  showConfidence = false,
}: ActiveChordDisplayProps) {
  let progress = 0;
  if (currentChord) {
    const duration = currentChord.endTime - currentChord.startTime;
    progress = duration > 0 ? (currentTime - currentChord.startTime) / duration : 0;
    progress = Math.min(1, Math.max(0, progress));
  }

  const currentConfidence = currentChord ? Math.round((currentChord.confidence ?? 0.88) * 100) : 0;
  const isConfident = currentConfidence >= 60;
  const currentParsed = currentChord
    ? formatChordDisplay(currentChord.chord, accidentalPreference)
    : null;

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      {/* Central Monolithic Specimen Card */}
      <div className="cinema-letterbox bracket-container p-5 flex flex-col justify-between flex-1 min-h-[220px]">
        <div className="bracket-tl" />
        <div className="bracket-tr" />
        <div className="bracket-bl" />
        <div className="bracket-br" />

        {/* Telemetry Header */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#86949e] border-b border-[#2a333a] pb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 ${
                !showConfidence || isConfident ? 'bg-[#d4a35f]' : 'bg-[#e06c75]'
              } inline-block`}
            />
            <span className="text-[#eceeed] font-bold">NOW PLAYING</span>
          </div>
          <span
            className={
              !showConfidence || isConfident ? 'text-[#d4a35f]' : 'text-[#e06c75]'
            }
          >
            {currentChord
              ? showConfidence
                ? isConfident
                  ? 'LIVE SIGNAL'
                  : 'LOW CONFIDENCE'
                : 'LIVE'
              : 'STANDBY'}
          </span>
        </div>

        {/* Big Root + Quality */}
        <div className="my-auto py-3 text-center">
          {currentChord && currentParsed ? (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline justify-center">
                <span className="text-6xl sm:text-7xl font-black text-[#eceeed] tracking-tighter">
                  {currentParsed.root}
                </span>
                <span className="text-3xl sm:text-4xl font-bold text-[#d4a35f] ml-1">
                  {currentParsed.quality}
                </span>
              </div>
              {currentParsed.bass && (
                <span className="text-sm font-mono text-[#86949e] mt-0.5">
                  /{currentParsed.bass}
                </span>
              )}
              {showConfidence && !isConfident && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono text-[#e06c75] border border-[#e06c75]/50 px-2.5 py-0.5 bg-[#e06c75]/15 uppercase tracking-wider font-bold">
                  <AlertTriangle className="w-3 h-3 text-[#e06c75]" />
                  <span>LOW CONFIDENCE ({currentConfidence}%) • VERIFY WITH AUDIO</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-3xl font-mono text-[#4a5761] uppercase tracking-widest">
              READY
            </span>
          )}
        </div>

        {/* Footer Metrics */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86949e] mb-1.5">
            {showConfidence ? (
              <div className="flex items-center gap-1">
                {isConfident ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4a35f]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#e06c75]" />
                )}
                <span>
                  CONFIDENCE:{' '}
                  <strong className={isConfident ? 'text-[#eceeed]' : 'text-[#e06c75]'}>
                    {currentConfidence}%
                  </strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[#86949e]">
                <span>AUDIO SYNC: REALTIME</span>
              </div>
            )}
            {currentChord && (
              <span>WINDOW: {formatTime(currentChord.startTime)} - {formatTime(currentChord.endTime)}</span>
            )}
          </div>

          {/* Solid Duration Bar */}
          <div className="w-full h-1 bg-[#14191d] overflow-hidden">
            <motion.div
              className={`h-full ${
                !showConfidence || isConfident ? 'bg-[#d4a35f]' : 'bg-[#4a5761]'
              }`}
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Flanking Context Nodes (Previous / Next) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Previous Node */}
        <button
          type="button"
          onClick={previousChord && onSeek ? () => onSeek(previousChord.startTime) : undefined}
          disabled={!previousChord}
          className={`p-2.5 bg-[#0e1113] border border-[#2a333a] text-left transition-colors ${
            previousChord ? 'hover:border-[#4a5761] hover:bg-[#14191d] cursor-pointer' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#86949e] uppercase mb-1">
            <ChevronLeft className="w-3 h-3 text-[#d4a35f]" />
            <span>PREVIOUS CHORD</span>
          </div>
          <div className="text-sm font-mono font-bold text-[#eceeed]">
            {previousChord ? previousChord.chord : '—'}
          </div>
          {previousChord && (
            <div className="text-[10px] font-mono text-[#4a5761] mt-0.5">
              AT {formatTime(previousChord.startTime)}
            </div>
          )}
        </button>

        {/* Next Node */}
        <button
          type="button"
          onClick={nextChord && onSeek ? () => onSeek(nextChord.startTime) : undefined}
          disabled={!nextChord}
          className={`p-2.5 bg-[#0e1113] border border-[#2a333a] text-left transition-colors ${
            nextChord ? 'hover:border-[#4a5761] hover:bg-[#14191d] cursor-pointer' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-[#86949e] uppercase mb-1">
            <span>NEXT CHORD</span>
            <ChevronRight className="w-3 h-3 text-[#d4a35f]" />
          </div>
          <div className="text-sm font-mono font-bold text-[#eceeed]">
            {nextChord ? nextChord.chord : '—'}
          </div>
          {nextChord && (
            <div className="text-[10px] font-mono text-[#4a5761] mt-0.5">
              AT {formatTime(nextChord.startTime)}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
