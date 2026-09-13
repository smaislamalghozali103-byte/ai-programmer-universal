import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true
});

/**
 * Custom renderer for syntax-highlighted code blocks with language badge and copy button
 */
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }): string {
  const language = (lang || '').trim().toLowerCase();
  let highlighted = '';

  if (language && hljs.getLanguage(language)) {
    try {
      highlighted = hljs.highlight(text, { language }).value;
    } catch {
      highlighted = hljs.highlightAuto(text).value;
    }
  } else {
    try {
      highlighted = hljs.highlightAuto(text).value;
    } catch {
      highlighted = escapeHtml(text);
    }
  }

  const displayLang = language || 'code';
  const encodedText = encodeURIComponent(text);

  return `
    <div class="code-block-container my-3 rounded-lg border border-slate-700/70 bg-[#0d1117] overflow-hidden shadow-sm">
      <div class="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs font-mono text-slate-300">
        <span class="flex items-center gap-1.5 font-semibold text-blue-400">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          ${escapeHtml(displayLang.toUpperCase())}
        </span>
        <button 
          type="button"
          class="copy-code-btn px-2.5 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-150 flex items-center gap-1 cursor-pointer font-sans text-xs"
          data-code="${encodedText}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <pre class="m-0 p-3 overflow-x-auto text-[13px] leading-relaxed"><code class="hljs ${language ? `language-${language}` : ''}">${highlighted}</code></pre>
    </div>
  `;
};

marked.use({ renderer });

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderMarkdown(content: string): string {
  if (!content) return '';
  return marked.parse(content) as string;
}
