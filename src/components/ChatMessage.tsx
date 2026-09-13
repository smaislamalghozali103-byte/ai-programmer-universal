import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Database, 
  Sparkles,
  Terminal,
  RotateCw
} from 'lucide-react';
import { Message } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface ChatMessageProps {
  message: Message;
  onRetry?: (content: string) => void;
  isLast?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry, isLast }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Set up copy handlers for code blocks inside the rendered markdown
  useEffect(() => {
    if (!contentRef.current) return;

    const copyButtons = contentRef.current.querySelectorAll('.copy-code-btn');
    const handlers: { btn: Element; handler: () => void }[] = [];

    copyButtons.forEach((btn) => {
      const handler = () => {
        const encoded = btn.getAttribute('data-code');
        if (encoded) {
          const rawCode = decodeURIComponent(encoded);
          navigator.clipboard.writeText(rawCode).then(() => {
            const span = btn.querySelector('span');
            if (span) {
              const prev = span.textContent;
              span.textContent = 'Copied!';
              setTimeout(() => {
                span.textContent = prev || 'Copy';
              }, 2000);
            }
          });
        }
      };
      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [message.content]);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-4 px-3 md:px-5 transition-colors ${
        isUser 
          ? 'bg-transparent' 
          : 'bg-slate-900/40 border-y border-slate-800/40 dark:bg-slate-900/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3.5 md:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md shadow-blue-500/20">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-200">
                {isUser ? 'You' : 'AI Programmer'}
              </span>

              {!isUser && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  <Terminal className="w-3 h-3" />
                  {message.model || 'Groq Llama 3.3'}
                </span>
              )}

              {message.loggedToSheet && (
                <span 
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                  title="Stored in Google Spreadsheet"
                >
                  <Database className="w-3 h-3" />
                  Sheet Synced
                </span>
              )}

              <span className="text-[11px] text-slate-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Quick Action buttons */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={handleCopyAll}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1"
                title="Copy entire response"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {!isUser && onRetry && isLast && (
                <button
                  onClick={() => onRetry(message.content)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1 ml-1"
                  title="Regenerate code"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Retry</span>
                </button>
              )}
            </div>
          </div>

          {/* Message Markdown or Plaintext */}
          {isUser ? (
            <div className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed font-normal">
              {message.content}
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="prose-ai text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
