import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { LoadingStep } from '../types';

interface LoadingStepsProps {
  steps: LoadingStep[];
  errorMessage?: string | null;
  onBack?: () => void;
  onFallbackDemo?: () => void;
}

const statusIcon = (status: LoadingStep['status']) => {
  switch (status) {
    case 'done':
      return (
        <div className="w-5 h-5 bg-[#14191d] border border-[#d4a35f] flex items-center justify-center text-[#d4a35f]">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      );
    case 'active':
      return <Loader2 className="w-5 h-5 text-[#d4a35f] animate-spin stroke-[2]" />;
    case 'error':
      return (
        <div className="w-5 h-5 bg-red-950/60 border border-red-600 flex items-center justify-center text-red-400">
          <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
        </div>
      );
    default:
      return (
        <div className="w-5 h-5 border border-[#2a333a] flex items-center justify-center text-[#4a5761]">
          <div className="w-1.5 h-1.5 bg-[#2a333a]" />
        </div>
      );
  }
};

export default function LoadingSteps({ steps, errorMessage, onBack, onFallbackDemo }: LoadingStepsProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="cinema-letterbox bracket-container p-6 sm:p-8">
        <div className="bracket-tl" />
        <div className="bracket-tr" />
        <div className="bracket-bl" />
        <div className="bracket-br" />

        <div className="text-[11px] font-mono text-[#86949e] border-b border-[#2a333a] pb-2 mb-6 flex items-center justify-between">
          <span>CHORDSENSE</span>
          <span className="text-[#d4a35f]">ANALYZING AUDIO</span>
        </div>

        <h2 className="text-base font-mono font-bold text-[#eceeed] mb-6 uppercase tracking-wider">
          {errorMessage ? 'ANALYSIS ERROR' : 'DETECTING CHORDS'}
        </h2>

        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.2 }}
                className="flex items-center gap-3.5"
              >
                <div className="shrink-0">{statusIcon(step.status)}</div>
                <span
                  className={`text-xs font-mono leading-snug transition-colors uppercase ${
                    step.status === 'active'
                      ? 'text-[#eceeed] font-bold'
                      : step.status === 'done'
                      ? 'text-[#86949e]'
                      : step.status === 'error'
                      ? 'text-red-400 font-bold'
                      : 'text-[#4a5761]'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 mb-5 text-xs text-red-300 font-mono leading-relaxed">
            {errorMessage}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 px-3 bg-[#14191d] hover:bg-[#1e252b] text-[#eceeed] text-xs font-mono border border-[#2a333a] transition-colors cursor-pointer uppercase"
              >
                ← TRY AGAIN
              </button>
            )}
            {onFallbackDemo && (
              <button
                type="button"
                onClick={onFallbackDemo}
                className="flex-1 py-2 px-3 bg-[#d4a35f] hover:bg-[#e5c07b] text-black text-xs font-mono font-bold transition-colors cursor-pointer uppercase"
              >
                LOAD DEMO CHORDS
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
