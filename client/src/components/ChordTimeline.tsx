import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ChordSegment } from '../types';
import { formatChordDisplay, type AccidentalPreference } from '../utils/transpose';

interface ChordTimelineProps {
  chords: ChordSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  autoScroll: boolean;
  accidentalPreference?: AccidentalPreference;
  minConfidence?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChordTimeline({
  chords,
  currentTime,
  onSeek,
  autoScroll,
  accidentalPreference,
}: ChordTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const activeIndex = chords.findIndex(
    (c) => currentTime >= c.startTime && currentTime < c.endTime
  );

  useEffect(() => {
    if (autoScroll && activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex, autoScroll]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto overflow-y-hidden py-2 focus:outline-none scroll-smooth"
    >
      <div className="flex gap-2 min-w-max pb-1">
        {chords.map((chord, i) => {
          const isActive = i === activeIndex;
          const isPast = activeIndex >= 0 && i < activeIndex;
          const confidencePct = Math.round((chord.confidence ?? 0.88) * 100);
          const isConfident = confidencePct >= 60;
          const { root, quality, bass } = formatChordDisplay(chord.chord, accidentalPreference);

          return (
            <button
              type="button"
              key={chord.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSeek(chord.startTime)}
              title={
                `Jump to ${chord.chord} (${formatTime(chord.startTime)}) • Confidence: ${confidencePct}%${
                  !isConfident ? ' (Warning: <60% confidence)' : ''
                }`
              }
              className={`flex-none w-28 p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[84px] focus:outline-none relative ${
                isActive
                  ? 'bg-[#1e252b] border-[#d4a35f]'
                  : !isConfident
                  ? 'bg-[#120e0e] border-[#5a282a] hover:border-[#e06c75]'
                  : isPast
                  ? 'bg-[#08090a] border-[#1c2227] opacity-60 hover:opacity-100 hover:border-[#2a333a]'
                  : 'bg-[#14191d] border-[#2a333a] hover:border-[#4a5761] hover:bg-[#181f24]'
              }`}
            >
              {/* Header: Timestamp and Confidence pill */}
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-[10px] font-mono leading-none ${
                    isActive ? 'text-[#d4a35f] font-bold' : 'text-[#86949e]'
                  }`}
                >
                  {formatTime(chord.startTime)}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.5 font-mono leading-none ${
                    !isConfident
                      ? 'bg-[rgba(224,108,117,0.2)] text-[#e06c75] border border-[#e06c75] font-bold'
                      : isActive
                      ? 'bg-[rgba(212,163,95,0.15)] text-[#d4a35f] border border-[#d4a35f]'
                      : 'bg-[#08090a] text-[#86949e] border border-[#2a333a]'
                  }`}
                >
                  {!isConfident ? `⚠️ ${confidencePct}%` : `≥${confidencePct}%`}
                </span>
              </div>

              {/* Main Chord Label - Always visible, visually badged when <60% */}
              <div className="flex items-baseline gap-0.5 my-auto">
                <span
                  className={`text-xl font-black tracking-tight ${
                    isActive
                      ? 'text-[#eceeed]'
                      : !isConfident
                      ? 'text-[#f0a8ad]'
                      : isPast
                      ? 'text-[#86949e]'
                      : 'text-[#eceeed]'
                  }`}
                >
                  {root}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isActive
                      ? 'text-[#d4a35f]'
                      : !isConfident
                      ? 'text-[#e06c75]'
                      : isPast
                      ? 'text-[#4a5761]'
                      : 'text-[#86949e]'
                  }`}
                >
                  {quality}
                </span>
                {bass && (
                  <span
                    className={`text-[10px] font-mono ${
                      isActive ? 'text-[#d4a35f]' : 'text-[#4a5761]'
                    }`}
                  >
                    /{bass}
                  </span>
                )}
              </div>

              {!isConfident && (
                <div className="text-[8px] font-mono text-[#e06c75] uppercase tracking-wider font-semibold">
                  LOW CONF
                </div>
              )}

              {/* Active Tracking Bar */}
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#d4a35f]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
