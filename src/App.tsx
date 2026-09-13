import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Menu, 
  Sun, 
  Moon, 
  Trash2, 
  Sparkles, 
  Code2, 
  Database, 
  FileCode2, 
  Settings as SettingsIcon, 
  Bot, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

import { ChatSession, Message, ProgrammingLanguage, AppSettings } from './types';
import { 
  loadStoredSessions, 
  saveStoredSessions, 
  loadStoredSettings, 
  saveStoredSettings,
  loadActiveSessionId,
  saveActiveSessionId 
} from './utils/storage';
import { STARTER_PROMPTS, ACTION_PRESETS } from './utils/templates';

import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { DeploymentModal } from './components/DeploymentModal';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadStoredSettings());
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('Python');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedSessions = loadStoredSessions();
    setSessions(loadedSessions);

    const savedActiveId = loadActiveSessionId();
    if (savedActiveId && loadedSessions.some(s => s.id === savedActiveId)) {
      setActiveSessionId(savedActiveId);
    } else if (loadedSessions.length > 0) {
      setActiveSessionId(loadedSessions[0].id);
    } else {
      // Create initial empty session
      createNewSession('Python');
    }
  }, []);

  // Save sessions on state change
  useEffect(() => {
    if (sessions.length > 0) {
      saveStoredSessions(sessions);
    }
  }, [sessions]);

  // Apply theme to document
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [settings.theme]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const messages = currentSession?.messages || [];

  const createNewSession = (lang: ProgrammingLanguage = selectedLanguage) => {
    const newId = 'session_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Coding Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      language: lang
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    saveActiveSessionId(newId);
    setErrorMessage(null);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    saveActiveSessionId(id);
    setErrorMessage(null);
    const s = sessions.find(x => x.id === id);
    if (s?.language) {
      setSelectedLanguage(s.language);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          saveActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
      return remaining;
    });
  };

  const handleClearAllSessions = () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      setSessions([]);
      setActiveSessionId(null);
      saveStoredSessions([]);
      createNewSession();
    }
  };

  const handleClearCurrentChat = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [], updatedAt: new Date().toISOString() };
      }
      return s;
    }));
    setErrorMessage(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme as 'dark' | 'light' };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // Main chat submission handler
  const handleSendMessage = async (text: string, lang: ProgrammingLanguage) => {
    let session = currentSession;
    let sessionId = activeSessionId;

    if (!session || !sessionId) {
      const newId = 'session_' + Date.now();
      const newSession: ChatSession = {
        id: newId,
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        language: lang
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      saveActiveSessionId(newId);
      session = newSession;
      sessionId = newId;
    }

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      language: lang
    };

    // Update conversation title if first message
    const isFirstMessage = session.messages.length === 0;
    const sessionTitle = isFirstMessage 
      ? text.slice(0, 36) + (text.length > 36 ? '...' : '') 
      : session.title;

    const updatedMessages = [...session.messages, userMessage];

    // Optimistically update UI
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          title: sessionTitle,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages,
          language: lang
        };
      }
      return s;
    }));

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.role === 'user' && m.language ? `[Language Context: ${m.language}]\n${m.content}` : m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: settings.model,
          temperature: settings.temperature,
          sessionId: sessionId,
          systemPrompt: settings.systemPrompt,
          googleSheetWebAppUrl: settings.autoLogToSheet ? settings.googleSheetWebAppUrl : ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const assistantMessage: Message = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: data.response || 'No response returned from AI.',
        timestamp: new Date().toISOString(),
        model: data.model || settings.model,
        loggedToSheet: data.loggedToSheet
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            messages: [...updatedMessages, assistantMessage]
          };
        }
        return s;
      }));
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'An error occurred while generating code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (content: string) => {
    // Find the last user message to retry
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.content, (lastUser.language as ProgrammingLanguage) || selectedLanguage);
    }
  };

  const isLight = settings.theme === 'light';

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={() => createNewSession()}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      {/* Main Conversation Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className={`h-14 px-4 border-b flex items-center justify-between shrink-0 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span className="text-blue-500 font-mono">&lt;/&gt;</span>
                AI Programmer Universal
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {settings.model}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Google Sheets Sync indicator */}
            {settings.googleSheetWebAppUrl && (
              <div 
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono"
                title="Conversations auto-logged to Google Spreadsheet"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sheets Sync Active</span>
              </div>
            )}

            {/* Clear chat */}
            <button
              onClick={handleClearCurrentChat}
              disabled={messages.length === 0}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Clear current messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Documentation Hub */}
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Setup & Vercel</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Model & Sheet Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Feed Area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 space-y-8">
              
              {/* Hero Banner */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1 font-mono text-xl font-bold">
                  &lt;/&gt;
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  Senior AI Programmer & Software Engineer
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Specialized in writing, debugging, explaining, and refactoring production-grade code in 
                  <strong className="text-slate-200"> Python, C, C++, JavaScript, TypeScript, Java, PHP, SQL, Rust, Go</strong>, and more.
                </p>

                {/* Architecture badges */}
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap text-xs text-slate-400">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 font-mono">
                    Groq Llama 3.3 70B
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 font-mono">
                    Vercel Serverless Function
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 font-mono">
                    Google Sheets Logger
                  </span>
                </div>
              </div>

              {/* AI Capabilities Matrix */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  10 Core Senior Engineering Capabilities:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {ACTION_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSendMessage(p.promptTemplate(selectedLanguage), selectedLanguage)}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-850 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-blue-400">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {p.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Launchpad Starter Prompts */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Ready-to-Run Starter Implementations:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STARTER_PROMPTS.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedLanguage(starter.lang as ProgrammingLanguage);
                        handleSendMessage(starter.prompt, starter.lang as ProgrammingLanguage);
                      }}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-left transition-all flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                            {starter.lang}
                          </span>
                          <span className="font-semibold text-xs text-slate-200 group-hover:text-white">
                            {starter.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {starter.prompt}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Render active conversation */
            <div className="divide-y divide-slate-800/30">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === messages.length - 1}
                  onRetry={handleRetry}
                />
              ))}

              {/* Loading indicator bubble */}
              {isLoading && (
                <div className="w-full py-4 px-3 md:px-5 bg-slate-900/40 border-y border-slate-800/40">
                  <div className="max-w-4xl mx-auto flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-md shadow-blue-500/20 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">AI Programmer</span>
                        <span className="font-mono text-[10px] text-blue-400">Engineering solution...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error banner if generation failed */}
              {errorMessage && (
                <div className="max-w-4xl mx-auto p-4 my-2">
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block text-red-300 font-semibold">Generation Error</strong>
                      <p>{errorMessage}</p>
                      <p className="text-[11px] text-red-400 pt-1">
                        Tip: Open the <strong>Setup & Vercel</strong> hub at the top right to verify your <code>GROQ_API_KEY</code> setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
        />

      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      <DeploymentModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

    </div>
  );
}
