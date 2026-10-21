import { Minus, Plus, Guitar, Clock, RotateCcw } from 'lucide-react';
import type { AccidentalPreference } from '../utils/transpose';

interface TransposeControlsProps {
  transpose: number;
  capo: number;
  syncOffset: number;
  accidentalPreference: AccidentalPreference;
  filterPassingChords: boolean;
  showConfidence?: boolean;
  onTransposeChange: (value: number) => void;
  onCapoChange: (value: number) => void;
  onSyncOffsetChange: (value: number) => void;
  onAccidentalPreferenceChange: (pref: AccidentalPreference) => void;
  onFilterPassingChordsChange: (enabled: boolean) => void;
  onShowConfidenceChange?: (val: boolean) => void;
  songKey: string;
  suggestedCapo?: number;
}

export default function TransposeControls({
  transpose,
  capo,
  syncOffset,
  accidentalPreference,
  filterPassingChords,
  showConfidence = false,
  onTransposeChange,
  onCapoChange,
  onSyncOffsetChange,
  onAccidentalPreferenceChange,
  onFilterPassingChordsChange,
  onShowConfidenceChange,
  songKey,
  suggestedCapo,
}: TransposeControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      {/* Musical Key Matrix */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#14191d] border border-[#2a333a]">
        <span className="text-[#86949e]">KEY:</span>
        <span className="font-bold text-[#eceeed]">{songKey}</span>
      </div>

      {/* Enharmonic Notation Toggle (Sharps vs Flats) */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#14191d] border border-[#2a333a]">
        <span className="text-[#86949e]">NOTATION:</span>
        <div className="inline-flex items-center bg-[#08090a] border border-[#2a333a] p-0.5">
          <button
            type="button"
            onClick={() => onAccidentalPreferenceChange('sharp')}
            className={`px-2 py-0.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
              accidentalPreference === 'sharp'
                ? 'bg-[rgba(212,163,95,0.18)] text-[#d4a35f] border border-[#d4a35f]'
                : 'text-[#86949e] hover:text-[#eceeed]'
            }`}
            title="Display chords using Sharps (#)"
          >
            ♯ SHARP
          </button>
          <button
            type="button"
            onClick={() => onAccidentalPreferenceChange('flat')}
            className={`px-2 py-0.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
              accidentalPreference === 'flat'
                ? 'bg-[rgba(212,163,95,0.18)] text-[#d4a35f] border border-[#d4a35f]'
                : 'text-[#86949e] hover:text-[#eceeed]'
            }`}
            title="Display chords using Flats (♭)"
          >
            ♭ FLAT
          </button>
        </div>
      </div>

      {/* Confidence Indicators Toggle */}
      {onShowConfidenceChange && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#14191d] border border-[#2a333a]">
          <span className="text-[#86949e]">CONFIDENCE:</span>
          <button
            type="button"
            onClick={() => onShowConfidenceChange(!showConfidence)}
            className={`px-2 py-0.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
              showConfidence
                ? 'bg-[rgba(212,163,95,0.18)] text-[#d4a35f] border border-[#d4a35f]'
                : 'text-[#86949e] hover:text-[#eceeed]'
            }`}
            title={
              showConfidence
                ? 'Hide confidence tags and warning indicators'
                : 'Show confidence percentage tags and accuracy alerts'
            }
          >
            {showConfidence ? 'SHOWN' : 'HIDDEN'}
          </button>
        </div>
      )}

      {/* Passing Chords / Transient Blip Filter Toggle */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#14191d] border border-[#2a333a]">
        <span className="text-[#86949e]">PASSING NOTES:</span>
        <button
          type="button"
          onClick={() => onFilterPassingChordsChange(!filterPassingChords)}
          className={`px-2 py-0.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
            filterPassingChords
              ? 'bg-[rgba(212,163,95,0.18)] text-[#d4a35f] border border-[#d4a35f]'
              : 'text-[#86949e] hover:text-[#eceeed]'
          }`}
          title={
            filterPassingChords
              ? 'Filtering out transient passing notes, vocal vibrato, and bass walkdowns'
              : 'Displaying all raw transient passing notes'
          }
        >
          {filterPassingChords ? 'FILTERED' : 'ALL'}
        </button>
      </div>

      {/* Transpose Stepper */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#14191d] border border-[#2a333a]">
        <span className="text-[#86949e]">TRANSPOSE:</span>
        <div className="inline-flex items-center bg-[#08090a] border border-[#2a333a] p-0.5">
          <button
            type="button"
            onClick={() => onTransposeChange(transpose - 1)}
            aria-label="Transpose down 1 semitone"
            className="w-5 h-5 flex items-center justify-center hover:bg-[#1e252b] text-[#eceeed] transition-colors cursor-pointer"
            title="Transpose down 1 semitone"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center font-bold text-[#d4a35f]">
            {transpose > 0 ? `+${transpose}` : transpose}
          </span>
          <button
            type="button"
            onClick={() => onTransposeChange(transpose + 1)}
            aria-label="Transpose up 1 semitone"
            className="w-5 h-5 flex items-center justify-center hover:bg-[#1e252b] text-[#eceeed] transition-colors cursor-pointer"
            title="Transpose up 1 semitone"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {transpose !== 0 && (
          <button
            type="button"
            onClick={() => onTransposeChange(0)}
            className="p-1 text-[#86949e] hover:text-[#eceeed] transition-colors"
            title="Reset Transpose"
            aria-label="Reset transpose to 0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Capo Settings */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#14191d] border border-[#2a333a]">
        <Guitar className="w-3.5 h-3.5 text-[#86949e]" />
        <span className="text-[#86949e]">CAPO:</span>
        <select
          value={capo}
          onChange={(e) => onCapoChange(Number(e.target.value))}
          className="bg-[#08090a] hover:bg-[#14191d] border border-[#2a333a] px-2 py-0.5 text-xs font-mono font-bold text-[#eceeed] focus:outline-none cursor-pointer"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <option key={i} value={i} className="bg-[#08090a] text-[#eceeed]">
              {i === 0 ? 'NONE' : `FRET ${i}${suggestedCapo === i ? ' ★ (ORIGINAL)' : ''}`}
            </option>
          ))}
        </select>
      </div>

      {/* Micro-Timing Sync Nudge */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#14191d] border border-[#2a333a]">
        <Clock className="w-3.5 h-3.5 text-[#86949e]" />
        <span className="text-[#86949e]">SYNC OFFSET:</span>
        <div className="inline-flex items-center bg-[#08090a] border border-[#2a333a] p-0.5">
          <button
            type="button"
            onClick={() => onSyncOffsetChange(Math.round((syncOffset - 0.2) * 10) / 10)}
            className="px-1.5 py-0.5 hover:bg-[#1e252b] text-[#86949e] hover:text-[#eceeed] transition-colors cursor-pointer text-[10px]"
            title="Nudge chords earlier (-0.2s)"
          >
            -0.2S
          </button>
          <span className="w-12 text-center font-bold text-[#d4a35f]">
            {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
          </span>
          <button
            type="button"
            onClick={() => onSyncOffsetChange(Math.round((syncOffset + 0.2) * 10) / 10)}
            className="px-1.5 py-0.5 hover:bg-[#1e252b] text-[#86949e] hover:text-[#eceeed] transition-colors cursor-pointer text-[10px]"
            title="Nudge chords later (+0.2s)"
          >
            +0.2S
          </button>
        </div>

        {syncOffset !== 0 && (
          <button
            type="button"
            onClick={() => onSyncOffsetChange(0)}
            className="p-1 text-[#86949e] hover:text-[#eceeed] transition-colors"
            title="Reset Sync"
            aria-label="Reset audio sync"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
