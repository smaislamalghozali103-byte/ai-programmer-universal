import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  Terminal, 
  Search, 
  Settings, 
  FileCode2, 
  ExternalLink,
  ChevronLeft,
  X,
  Database
} from 'lucide-react';
import { ChatSession, ProgrammingLanguage } from '../types';
import { PROGRAMMING_LANGUAGES } from '../utils/templates';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  selectedLanguage: ProgrammingLanguage;
  onSelectLanguage: (lang: ProgrammingLanguage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  onOpenSettings,
  onOpenDocs,
  isOpen,
  onCloseMobile,
  selectedLanguage,
  onSelectLanguage
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLanguage === 'All' || session.language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-76 flex flex-col
          bg-slate-900 border-r border-slate-800 text-slate-200
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-blue-500/20">
              &lt;/&gt;
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                AI Programmer
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">Universal</span>
              </h1>
              <p className="text-[11px] text-slate-400">Senior Software Engineer</p>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            id="new-chat-sidebar-btn"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Language Filter Tags */}
        <div className="px-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar text-[11px]">
          {PROGRAMMING_LANGUAGES.slice(0, 6).map((lang) => (
            <button
              key={lang}
              onClick={() => onSelectLanguage(lang)}
              className={`px-2 py-0.5 rounded font-mono text-[11px] whitespace-nowrap transition cursor-pointer ${
                selectedLanguage === lang
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Chat Sessions History List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Conversations ({filteredSessions.length})</span>
            {sessions.length > 0 && (
              <button 
                onClick={onClearAll}
                className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                title="Clear all conversations"
              >
                Clear All
              </button>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-500">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              {searchQuery ? 'No matching chats found' : 'No conversations yet. Start a new chat!'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`
                    group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all
                    ${isActive 
                      ? 'bg-slate-800 text-white font-medium shadow-xs border border-slate-700/80' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <Terminal className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate">{session.title || 'Untitled Session'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {session.language && session.language !== 'All' && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-700/50 text-slate-400">
                        {session.language}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & links */}
        <div className="p-3 border-t border-slate-800 space-y-1.5 bg-slate-950/40 text-xs">
          <button
            onClick={onOpenDocs}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-blue-400" />
              <span>Deployment & Apps Script</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">Guide</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Model & Sheets Config</span>
            </div>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </aside>
    </>
  );
};
