import { ChatSession, AppSettings } from '../types';

const STORAGE_KEY_SESSIONS = 'ai_programmer_universal_sessions_v1';
const STORAGE_KEY_SETTINGS = 'ai_programmer_universal_settings_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'ai_programmer_universal_active_session_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  googleSheetWebAppUrl: '',
  autoLogToSheet: true,
  systemPrompt: `You are an advanced multilingual AI Programmer and Senior Software Engineer. You master Python, C, C++, HTML, CSS, JavaScript, Java, PHP, SQL, Rust, Go, TypeScript, React, Node.js, databases, AI development, and modern software engineering.

Provide accurate, clean, secure, scalable, and production-quality code. Explain solutions clearly. Adapt to beginner and advanced users. Never expose secrets or API keys.`
};

export function loadStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load stored sessions:', e);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
  } catch (e) {
    return null;
  }
}

export function saveActiveSessionId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, id);
  } catch (e) {
    console.error('Failed to save active session ID:', e);
  }
}
