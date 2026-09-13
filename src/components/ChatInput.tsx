import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Square, 
  Sparkles, 
  Terminal, 
  Code2, 
  Bug, 
  Zap, 
  ArrowLeftRight, 
  ShieldCheck, 
  ChevronDown,
  Layers,
  Wrench,
  BookOpen
} from 'lucide-react';
import { ProgrammingLanguage } from '../types';
import { PROGRAMMING_LANGUAGES, ACTION_PRESETS, ActionPreset } from '../utils/templates';

interface ChatInputProps {
  onSendMessage: (text: string, language: ProgrammingLanguage) => void;
  isLoading: boolean;
  selectedLanguage: ProgrammingLanguage;
  onSelectLanguage: (lang: ProgrammingLanguage) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedLanguage,
  onSelectLanguage
}) => {
  const [input, setInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), selectedLanguage);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applyPreset = (preset: ActionPreset) => {
    const lang = selectedLanguage === 'All' ? 'Python' : selectedLanguage;
    const template = preset.promptTemplate(lang);
    setInput(template);
    setShowPresets(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-md p-3 md:p-4">
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Top Control Bar: Language pills & Action presets */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {/* Languages Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Language:
            </span>
            {PROGRAMMING_LANGUAGES.filter(l => l !== 'All').slice(0, 7).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onSelectLanguage(lang)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  selectedLanguage === lang
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Action presets dropup */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/70 text-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Tasks ({ACTION_PRESETS.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>

            {showPresets && (
              <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-1.5 max-h-80 overflow-y-auto space-y-0.5">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                  Select AI Programmer Task
                </div>
                {ACTION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex flex-col gap-0.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{preset.name}</span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Box */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask AI Programmer to write, debug, or optimize ${selectedLanguage === 'All' ? 'any code' : selectedLanguage}... (Enter to send, Shift+Enter for newline)`}
            className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-500 resize-none outline-none max-h-48 min-h-[44px] py-2 px-1 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 pb-1 shrink-0">
            <button
              id="send-message-button"
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                input.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span>Powered by <strong>Groq API</strong></span>
            <span>•</span>
            <span>Vercel Serverless Function</span>
          </div>
          <div className="hidden sm:block">
            Shift + Enter for multi-line
          </div>
        </div>

      </div>
    </div>
  );
};
