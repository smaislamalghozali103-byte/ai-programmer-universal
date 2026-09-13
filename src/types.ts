export type ProgrammingLanguage =
  | 'All'
  | 'Python'
  | 'C'
  | 'C++'
  | 'HTML/CSS'
  | 'JavaScript'
  | 'TypeScript'
  | 'Java'
  | 'PHP'
  | 'SQL'
  | 'Rust'
  | 'Go';

export type AIActionPreset =
  | 'code_generation'
  | 'code_explanation'
  | 'debugging'
  | 'error_fixing'
  | 'code_optimization'
  | 'code_conversion'
  | 'architecture_design'
  | 'project_generation'
  | 'programming_tutoring'
  | 'code_review';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  language?: string;
  loggedToSheet?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  language?: ProgrammingLanguage;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  model: string;
  temperature: number;
  googleSheetWebAppUrl: string;
  autoLogToSheet: boolean;
  systemPrompt: string;
}

export interface ChatApiRequest {
  messages: { role: string; content: string }[];
  model?: string;
  temperature?: number;
  sessionId?: string;
  systemPrompt?: string;
  googleSheetWebAppUrl?: string;
}

export interface ChatApiResponse {
  response: string;
  model: string;
  provider: 'groq' | 'gemini' | 'simulation';
  sessionId?: string;
  loggedToSheet?: boolean;
  sheetError?: string;
  error?: string;
}
