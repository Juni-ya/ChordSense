import { Activity, Github, Plus, Radio } from 'lucide-react';

interface HeaderProps {
  onNewAnalysis?: () => void;
  isWorkspace?: boolean;
}

export default function Header({ onNewAnalysis, isWorkspace }: HeaderProps) {
  return (
    <header className="optical-bridge sticky top-0 z-50 h-13 border-b border-[#2a333a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand & Forensic Signal Indicator */}
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          title={isWorkspace ? 'Return to signal ingest' : 'ChordSense AI'}
        >
          <div className="w-7 h-7 bg-[#14191d] border border-[#2a333a] group-hover:border-[#d4a35f] flex items-center justify-center text-[#d4a35f] transition-colors">
            <Radio className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-[#eceeed]">
              CHORDSENSE
            </span>
            <span className="telemetry-stamp text-[10px] py-0.5">
              SYS // 2.5
            </span>
            <span className="text-[11px] font-mono text-[#4a5761] hidden sm:inline-block border-l border-[#2a333a] pl-2.5">
              47°08'N 109°32'W
            </span>
          </div>
        </button>

        {/* Action Dock */}
        <div className="flex items-center gap-2.5">
          {isWorkspace && onNewAnalysis && (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a35f] hover:bg-[#e5c07b] text-black text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Ingest</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#86949e] px-2 py-1 bg-[#14191d] border border-[#2a333a]">
            <Activity className="w-3 h-3 text-[#4ade80]" />
            <span>ONLINE</span>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source repository"
            className="w-7 h-7 flex items-center justify-center text-[#86949e] hover:text-[#eceeed] bg-[#14191d] border border-[#2a333a] hover:border-[#4a5761] transition-colors"
            title="Source Repository"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
