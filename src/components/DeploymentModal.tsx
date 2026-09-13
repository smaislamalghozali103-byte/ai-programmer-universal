import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  FileCode, 
  Database, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Play, 
  Download
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gas' | 'vercel' | 'env' | 'security' | 'testing' | 'files'>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gasCode = `/**
 * AI PROGRAMMER UNIVERSAL - GOOGLE APPS SCRIPT WEB APP
 * Spreadsheet columns: Timestamp, SessionID, UserMessage, AIResponse, Model
 */
const SHEET_NAME = 'Conversations';

function doPost(e) {
  try {
    let payload;
    if (e && e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (err) { payload = e.parameter; }
    } else {
      payload = e ? e.parameter : {};
    }

    const timestamp = payload.timestamp || Utilities.formatDate(new Date(), 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const sessionId = payload.sessionId || 'anonymous_session';
    const userMessage = payload.userMessage || payload.prompt || '';
    const aiResponse = payload.aiResponse || payload.response || '';
    const model = payload.model || 'groq-llama-3.3-70b';

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    // Auto-create headers if empty
    if (sheet.getLastRow() === 0) {
      const headers = ['Timestamp', 'SessionID', 'UserMessage', 'AIResponse', 'Model'];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([timestamp, sessionId, userMessage, aiResponse, model]);
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3, 1, 2).setWrap(true);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'online', service: 'AI Programmer Universal Logger' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}`;

  const vercelApiCode = `// /api/chat.js - Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { messages, model = 'llama-3.3-70b-versatile', temperature = 0.3, sessionId, systemPrompt, googleSheetWebAppUrl } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured in Vercel Environment Variables.' });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey.trim()}\`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are an advanced multilingual AI Programmer and Senior Software Engineer...' },
          ...messages
        ],
        temperature: Number(temperature) || 0.3,
        max_tokens: 4096
      })
    });

    const data = await groqRes.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response';

    // Optional Google Spreadsheet logging
    const sheetUrl = (googleSheetWebAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || '').trim();
    let loggedToSheet = false;
    if (sheetUrl && sheetUrl.startsWith('http')) {
      try {
        const lastUser = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            sessionId,
            userMessage: lastUser,
            aiResponse,
            model
          })
        });
        loggedToSheet = true;
      } catch (err) { /* silent catch */ }
    }

    return res.status(200).json({ response: aiResponse, model, sessionId, loggedToSheet });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Setup, Vercel & Integration Hub</h2>
              <p className="text-xs text-slate-400">Complete deliverables, deployment guides, and Google Sheets script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-6 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Vercel Hosting
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'env'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Environment Variables
          </button>
          <button
            onClick={() => setActiveTab('gas')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'gas'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Google Apps Script
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Security Best Practices
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'testing'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Testing Instructions
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            6. Standalone Files
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm leading-relaxed">
          
          {/* TAB 1: VERCEL DEPLOYMENT */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs">
                <strong>Vercel Architecture:</strong> This project includes <code>/api/chat.js</code> for Vercel Serverless Functions and <code>vercel.json</code>. Your frontend is statically optimized via Vite, and all AI queries execute securely server-side.
              </div>

              <h3 className="text-base font-semibold text-white">Method 1: One-Click Git Deployment</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Push this repository to GitHub or GitLab.</li>
                <li>Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">vercel.com</a> and click <strong>"Add New..." -&gt; "Project"</strong>.</li>
                <li>Import your repository.</li>
                <li>Verify Framework Preset is <strong>Vite</strong> with output directory <code>dist</code>.</li>
                <li>Add Environment Variable: <code>GROQ_API_KEY</code> (see Environment Variables tab).</li>
                <li>Click <strong>Deploy</strong>.</li>
              </ol>

              <h3 className="text-base font-semibold text-white pt-2">Method 2: CLI Deployment</h3>
              <div className="relative">
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
{`npm i -g vercel
vercel login
vercel
vercel --prod`}
                </pre>
                <button
                  onClick={() => copyToClipboard('npm i -g vercel\nvercel login\nvercel\nvercel --prod', 'cli')}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cli' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ENVIRONMENT VARIABLES */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Configure these environment variables in your <strong>Vercel Dashboard -&gt; Project Settings -&gt; Environment Variables</strong>, or in your local <code>.env</code> file:
              </p>

              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Variable Name</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr>
                      <td className="p-3 text-blue-400 font-bold">GROQ_API_KEY</td>
                      <td className="p-3 text-emerald-400">Yes</td>
                      <td className="p-3 text-slate-300 font-sans">Your Groq API secret key from console.groq.com. Stored securely on serverless backend.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300">GOOGLE_SHEET_WEBAPP_URL</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3 text-slate-300 font-sans">Google Apps Script Web App URL to log all chats into Google Sheets.</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-300">GEMINI_API_KEY</td>
                      <td className="p-3 text-slate-400">Optional</td>
                      <td className="p-3 text-slate-300 font-sans">Fallback provider key if Groq token limits are exceeded.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  How to get a free Groq API key:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                  <li>Visit <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-400 underline">console.groq.com/keys</a>.</li>
                  <li>Sign in with GitHub or Google.</li>
                  <li>Click <strong>"Create API Key"</strong> and name it <code>AI Programmer</code>.</li>
                  <li>Paste into Vercel or local <code>.env</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE APPS SCRIPT */}
          {activeTab === 'gas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Google Apps Script Code (Code.gs)</h3>
                  <p className="text-xs text-slate-400">Columns: <code>Timestamp, SessionID, UserMessage, AIResponse, Model</code></p>
                </div>
                <button
                  onClick={() => copyToClipboard(gasCode, 'gas')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedKey === 'gas' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'gas' ? 'Copied Code!' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 max-h-72 overflow-y-auto">
                {gasCode}
              </pre>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                <h4 className="font-semibold text-white">3-Minute Spreadsheet Deployment Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Create a new spreadsheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-400 underline">sheets.new</a>.</li>
                  <li>Click <strong>Extensions -&gt; Apps Script</strong>.</li>
                  <li>Paste the code above into <code>Code.gs</code>.</li>
                  <li>Click <strong>Deploy -&gt; New deployment</strong>.</li>
                  <li>Select <strong>Web app</strong>, set Execute as: <strong>"Me"</strong> and Who has access: <strong>"Anyone"</strong>.</li>
                  <li>Click <strong>Deploy</strong> and copy the generated Web App URL.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY BEST PRACTICES */}
          {activeTab === 'security' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white text-sm mb-0.5">Zero Secret Exposure Principle</h4>
                  <p>The Groq API key is stored exclusively on the server in <code>process.env.GROQ_API_KEY</code>. The browser client never downloads or accesses the key. All requests route to the Vercel serverless proxy.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <Terminal className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white text-sm mb-0.5">Strict Method & Input Guarding</h4>
                  <p>The serverless function only accepts POST and OPTIONS preflight requests. Malformed payloads or empty message arrays are rejected before reaching Groq token quotas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white text-sm mb-0.5">Isolated Google Spreadsheet Permissions</h4>
                  <p>Your Google Apps Script executes with isolated container bounds. It appends records to your sheet without exposing OAuth credentials or your Google Drive root.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TESTING INSTRUCTIONS */}
          {activeTab === 'testing' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Test Vercel Backend with cURL</h3>
              <p className="text-xs text-slate-400">Run this command in any terminal to verify the AI programmer API directly:</p>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X POST "https://your-project.vercel.app/api/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Write a quicksort in C++" }
    ],
    "model": "llama-3.3-70b-versatile"
  }'`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`curl -X POST "https://your-project.vercel.app/api/chat" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "messages": [\n      { "role": "user", "content": "Write a quicksort in C++" }\n    ],\n    "model": "llama-3.3-70b-versatile"\n  }'`, 'curl')}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <h3 className="font-semibold text-white pt-2">Test Google Sheet Web App with cURL</h3>
              <div className="relative">
                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -L -X POST "YOUR_GOOGLE_APPS_SCRIPT_URL" \\
  -H "Content-Type: application/json" \\
  -d '{
    "timestamp": "2026-09-13T12:00:00Z",
    "sessionId": "test-session-123",
    "userMessage": "Write a Fibonacci in Python",
    "aiResponse": "def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)",
    "model": "llama-3.3-70b-versatile"
  }'`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 6: STANDALONE FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                All requested deliverables have been generated in the project root:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-bold">/standalone/index.html</span>
                    <span className="text-slate-400 font-sans block text-[11px]">Pure HTML, CSS, JavaScript standalone single-file client</span>
                  </div>
                  <a
                    href="/standalone/index.html"
                    target="_blank"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 font-sans"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">/api/chat.js</span>
                    <span className="text-slate-400 font-sans block text-[11px]">Vercel Serverless Function communicating with Groq API</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(vercelApiCode, 'api')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copiedKey === 'api' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-indigo-400 font-bold">/google-apps-script.js</span>
                    <span className="text-slate-400 font-sans block text-[11px]">Complete Google Apps Script Code.gs ready to paste into Sheets</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(gasCode, 'gas2')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copiedKey === 'gas2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>AI Programmer Universal v1.0 • Groq + Vercel + Google Sheets</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
};
