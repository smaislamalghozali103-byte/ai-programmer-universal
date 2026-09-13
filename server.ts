import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const DEFAULT_SYSTEM_PROMPT = `You are an advanced multilingual AI Programmer and Senior Software Engineer. You master Python, C, C++, HTML, CSS, JavaScript, Java, PHP, SQL, Rust, Go, TypeScript, React, Node.js, databases, AI development, and modern software engineering.

Provide accurate, clean, secure, scalable, and production-quality code. Explain solutions clearly. Adapt to beginner and advanced users. Never expose secrets or API keys.`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSheetUrl: !!process.env.GOOGLE_SHEET_WEBAPP_URL
  });
});

// Environment configuration status (safe for frontend UI to inspect setup state)
app.get('/api/config-status', (req, res) => {
  res.json({
    hasGroqKey: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0),
    hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    hasSheetUrl: !!(process.env.GOOGLE_SHEET_WEBAPP_URL && process.env.GOOGLE_SHEET_WEBAPP_URL.trim().length > 0),
    defaultModel: 'llama-3.3-70b-versatile'
  });
});

// Primary Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'llama-3.3-70b-versatile',
      temperature = 0.3,
      sessionId = 'session_' + Date.now(),
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      googleSheetWebAppUrl
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "messages" array is required and must contain at least one message.'
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let aiResponseText = '';
    let usedModel = model;
    let provider: 'groq' | 'gemini' = 'groq';

    if (groqApiKey && groqApiKey.trim() !== '') {
      try {
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content)
          }))
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey.trim()}`
          },
          body: JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: Math.max(0, Math.min(2, Number(temperature) || 0.3)),
            max_tokens: 4096
          })
        });

        if (!groqRes.ok) {
          const errText = await groqRes.text();
          throw new Error(`Groq API responded with status ${groqRes.status}: ${errText}`);
        }

        const groqData: any = await groqRes.json();
        aiResponseText = groqData.choices?.[0]?.message?.content || 'No response returned from Groq API.';
        usedModel = groqData.model || model;
        provider = 'groq';
      } catch (groqErr: any) {
        console.error('Groq API Error:', groqErr.message);
        if (geminiApiKey) {
          console.log('Falling back to Gemini API...');
          aiResponseText = await callGeminiFallback(messages, systemPrompt, geminiApiKey);
          usedModel = 'gemini-3.8-flash (Groq fallback)';
          provider = 'gemini';
        } else {
          return res.status(502).json({
            error: `Groq API Error: ${groqErr.message}. Verify that GROQ_API_KEY is configured in your environment.`
          });
        }
      }
    } else if (geminiApiKey) {
      console.log('No GROQ_API_KEY detected in env; utilizing Gemini API fallback for preview...');
      try {
        aiResponseText = await callGeminiFallback(messages, systemPrompt, geminiApiKey);
        usedModel = 'gemini-3.8-flash (fallback)';
        provider = 'gemini';
      } catch (geminiErr: any) {
        return res.status(500).json({
          error: `AI Error: ${geminiErr.message}. Configure GROQ_API_KEY in environment variables.`
        });
      }
    } else {
      return res.status(500).json({
        error: 'GROQ_API_KEY is not set. Please add your GROQ_API_KEY to environment variables.'
      });
    }

    // Google Apps Script logging
    let loggedToSheet = false;
    let sheetError: string | null = null;
    const sheetUrl = (googleSheetWebAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || '').trim();

    if (sheetUrl && sheetUrl.startsWith('http')) {
      try {
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
        const sheetPayload = {
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
          userMessage: String(lastUserMsg),
          aiResponse: String(aiResponseText),
          model: usedModel
        };

        const sheetRes = await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetPayload),
          redirect: 'follow'
        });

        if (sheetRes.ok) {
          loggedToSheet = true;
        } else {
          sheetError = `HTTP ${sheetRes.status}`;
        }
      } catch (shErr: any) {
        console.warn('Google Sheet log warning:', shErr.message);
        sheetError = shErr.message;
      }
    }

    return res.status(200).json({
      response: aiResponseText,
      model: usedModel,
      provider: provider,
      sessionId: sessionId,
      loggedToSheet: loggedToSheet,
      sheetError: sheetError
    });
  } catch (err: any) {
    console.error('Server error in /api/chat:', err);
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while processing the AI request.'
    });
  }
});

// Helper endpoint to test Google Sheet connection directly
app.post('/api/test-sheet', async (req, res) => {
  try {
    const { url } = req.body;
    const targetUrl = (url || process.env.GOOGLE_SHEET_WEBAPP_URL || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Valid Google Apps Script Web App URL is required.' });
    }

    const testPayload = {
      timestamp: new Date().toISOString(),
      sessionId: 'test_connection_' + Date.now(),
      userMessage: 'Test message from AI Programmer Universal',
      aiResponse: 'Success! Your Google Spreadsheet connection is working properly.',
      model: 'system-test'
    };

    const sheetRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });

    if (!sheetRes.ok) {
      return res.status(502).json({ error: `Spreadsheet Web App returned HTTP status ${sheetRes.status}` });
    }

    const data = await sheetRes.json().catch(() => ({ status: 'success' }));
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to communicate with Google Sheet Web App' });
  }
});

async function callGeminiFallback(messages: any[], systemPrompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  
  const contents = [
    {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nStrictly adhere to the role of Senior AI Programmer.` }]
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. I am ready to provide expert-grade code, architecture, debugging, and software engineering assistance.' }]
    }
  ];

  for (const m of messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error: ${errBody}`);
  }

  const data: any = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return text;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Programmer Universal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
