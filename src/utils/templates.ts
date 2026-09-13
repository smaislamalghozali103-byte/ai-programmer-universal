import { ProgrammingLanguage } from '../types';

export interface ActionPreset {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  promptTemplate: (language: string) => string;
}

export const ACTION_PRESETS: ActionPreset[] = [
  {
    id: 'code_generation',
    name: 'Generate Code',
    category: 'Creation',
    iconName: 'Code',
    description: 'Produce clean, modular, and type-safe code for a specific feature or algorithm.',
    promptTemplate: (lang) => `Write a clean, production-ready implementation in ${lang} for: `
  },
  {
    id: 'debugging',
    name: 'Debug Code',
    category: 'Fixing',
    iconName: 'Bug',
    description: 'Analyze code to locate subtle bugs, logic flaws, and memory leaks.',
    promptTemplate: (lang) => `Debug this ${lang} code, identify all bugs or logic flaws, explain the root causes, and provide the corrected code:\n\n`
  },
  {
    id: 'error_fixing',
    name: 'Fix Error / Exception',
    category: 'Fixing',
    iconName: 'Wrench',
    description: 'Diagnose runtime errors, compiler warnings, or stack traces.',
    promptTemplate: (lang) => `I am encountering this error in my ${lang} application. Diagnose the cause and fix it:\n\nError Message/Stack Trace:\n\nCode snippet:\n`
  },
  {
    id: 'code_optimization',
    name: 'Optimize Performance',
    category: 'Refactoring',
    iconName: 'Zap',
    description: 'Improve algorithmic time and space complexity and eliminate bottlenecks.',
    promptTemplate: (lang) => `Analyze the time and space complexity of this ${lang} code and provide an optimized, high-performance refactoring:\n\n`
  },
  {
    id: 'code_conversion',
    name: 'Convert Language',
    category: 'Translation',
    iconName: 'ArrowLeftRight',
    description: 'Translate code idiomatically from one language to another.',
    promptTemplate: (lang) => `Translate the following code idiomatically into ${lang}, following standard conventions and best practices:\n\n`
  },
  {
    id: 'code_explanation',
    name: 'Explain Code',
    category: 'Understanding',
    iconName: 'FileText',
    description: 'Break down complex logic into step-by-step clear explanations.',
    promptTemplate: (lang) => `Provide a clear, in-depth architectural and line-by-line explanation of this ${lang} snippet:\n\n`
  },
  {
    id: 'architecture_design',
    name: 'Architecture Design',
    category: 'Engineering',
    iconName: 'Layers',
    description: 'Design robust software architecture, modules, interfaces, and patterns.',
    promptTemplate: (lang) => `Design a scalable, modular software architecture using ${lang} for the following system requirement: `
  },
  {
    id: 'full_project_generation',
    name: 'Full Project Scaffolding',
    category: 'Creation',
    iconName: 'FolderGit2',
    description: 'Generate file structures, dependencies, configs, and boilerplate code.',
    promptTemplate: (lang) => `Generate a complete full-stack project scaffold and folder structure using ${lang} with clean separation of concerns for: `
  },
  {
    id: 'code_review',
    name: 'Senior Code Review',
    category: 'Quality',
    iconName: 'CheckCircle2',
    description: 'Thorough review covering security, maintainability, tests, and scalability.',
    promptTemplate: (lang) => `Perform a comprehensive Senior Software Engineer code review on this ${lang} code, focusing on security, edge cases, maintainability, and code style:\n\n`
  },
  {
    id: 'programming_tutoring',
    name: 'Programming Tutor',
    category: 'Learning',
    iconName: 'GraduationCap',
    description: 'Understand deep concepts like concurrency, pointers, algorithms, and OOP.',
    promptTemplate: (lang) => `Teach me the fundamental and advanced concepts of this topic in ${lang} with interactive examples and mental models: `
  }
];

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  'All',
  'Python',
  'C',
  'C++',
  'JavaScript',
  'TypeScript',
  'Java',
  'PHP',
  'SQL',
  'Rust',
  'Go',
  'HTML/CSS'
];

export const STARTER_PROMPTS = [
  {
    title: 'Python Async Web Scraper',
    lang: 'Python',
    prompt: 'Write an asynchronous web scraper in Python using httpx and asyncio with concurrency rate limiting, retry backoff, and error handling.'
  },
  {
    title: 'C++ Lock-Free Thread Safe Queue',
    lang: 'C++',
    prompt: 'Implement a lock-free thread-safe Single-Producer Single-Consumer (SPSC) queue in modern C++20 using std::atomic and memory order semantics.'
  },
  {
    title: 'Rust High Performance Microservice',
    lang: 'Rust',
    prompt: 'Create a high-performance REST API in Rust using Axum and Tokio with database connection pooling, custom error middleware, and health check routes.'
  },
  {
    title: 'TypeScript Full CRUD with React',
    lang: 'TypeScript',
    prompt: 'Build a fully typed custom React hook in TypeScript for managing optimistic CRUD operations with rollback support and cached state.'
  },
  {
    title: 'Go Distributed Worker Pool',
    lang: 'Go',
    prompt: 'Implement a concurrent worker pool in Go with worker channels, graceful shutdown using context.Context, and job timeout cancellation.'
  },
  {
    title: 'SQL Complex Financial Ledger Query',
    lang: 'SQL',
    prompt: 'Write an optimized PostgreSQL query with Window functions and CTEs to compute rolling running balances, monthly cash flow deltas, and fraud anomalies.'
  }
];
