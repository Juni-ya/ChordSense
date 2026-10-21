import { useState } from 'react';
import { Key, X, Check, ExternalLink, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveKey }: ApiKeyModalProps) {
  const [inputVal, setInputVal] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputVal('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="cinema-letterbox bracket-container w-full max-w-md bg-[#0c0f11] border border-[#2a333a] p-6 text-[#eceeed]">
        <div className="bracket-tl" />
        <div className="bracket-tr" />
        <div className="bracket-bl" />
        <div className="bracket-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1e252b]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#d4a35f]" />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-[#eceeed]">
              API Key Configuration
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#86949e] hover:text-[#eceeed] p-1 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-[#86949e] leading-relaxed mb-4">
          Enter your personal Google Gemini API key for multimodal AI chord verification. Your key is stored securely in your browser&apos;s local storage and sent directly to your server.
        </p>

        {/* Key Input */}
        <div className="space-y-3 mb-5">
          <label className="block text-[11px] font-mono text-[#86949e] uppercase tracking-wider">
            Gemini API Key
          </label>
          <div className="bg-[#08090a] border border-[#2a333a] focus-within:border-[#d4a35f] transition-colors p-2 flex items-center">
            <input
              type="password"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-transparent text-xs font-mono text-[#eceeed] placeholder:text-[#4a5761] focus:outline-none"
            />
            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear key"
                className="text-[#86949e] hover:text-[#e06c75] p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#d4a35f] hover:underline"
          >
            <span>Get a free API key at Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e252b]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono text-[#86949e] hover:text-[#eceeed] border border-[#2a333a] hover:border-[#4a5761] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#d4a35f] hover:bg-[#e5c07b] text-black text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>SAVED</span>
              </>
            ) : (
              <span>SAVE KEY</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
