import { Key, Github, Plus, Radio } from 'lucide-react';

interface HeaderProps {
  onNewAnalysis?: () => void;
  isWorkspace?: boolean;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export default function Header({
  onNewAnalysis,
  isWorkspace,
  hasApiKey,
  onOpenApiKeyModal,
}: HeaderProps) {
  return (
    <header className="optical-bridge sticky top-0 z-50 h-13 border-b border-[#2a333a] bg-[#08090a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={onNewAnalysis}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          title={isWorkspace ? 'Return to home' : 'ChordSense'}
        >
          <div className="w-7 h-7 bg-[#14191d] border border-[#2a333a] group-hover:border-[#d4a35f] flex items-center justify-center text-[#d4a35f] transition-colors">
            <Radio className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-[#eceeed]">
              CHORDSENSE
            </span>
            <span className="text-[10px] font-mono text-[#d4a35f] bg-[#14191d] border border-[#2a333a] px-2 py-0.5 tracking-wider font-semibold">
              AI CHORD IDENTIFIER
            </span>
          </div>
        </button>

        {/* Action Dock */}
        <div className="flex items-center gap-2.5">
          {/* User API Key Config Button */}
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                hasApiKey
                  ? 'bg-[rgba(212,163,95,0.12)] border-[#d4a35f] text-[#d4a35f] font-semibold'
                  : 'bg-[#14191d] border-[#2a333a] text-[#86949e] hover:border-[#4a5761] hover:text-[#eceeed]'
              }`}
              title="Configure personal Gemini API Key"
            >
              <Key className="w-3 h-3" />
              <span>{hasApiKey ? 'KEY ACTIVE' : 'API KEY'}</span>
            </button>
          )}

          {/* Single, Non-Duplicate New Song Action */}
          {isWorkspace && onNewAnalysis && (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a35f] hover:bg-[#e5c07b] text-black text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
              title="Analyze a new song"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>NEW SONG</span>
            </button>
          )}

          <a
            href="https://github.com/Juni-ya/ChordSense"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source repository"
            className="w-7 h-7 flex items-center justify-center text-[#86949e] hover:text-[#eceeed] bg-[#14191d] border border-[#2a333a] hover:border-[#4a5761] transition-colors"
            title="GitHub Repository"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
