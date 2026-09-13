/**
 * Vercel Serverless Function: /api/chat.js
 * AI Provider: Groq API (https://api.groq.com/openai/v1/chat/completions)
 * Database: Optional Google Spreadsheet logging via Google Apps Script Web App
 */

const DEFAULT_SYSTEM_PROMPT = `You are an advanced multilingual AI Programmer and Senior Software Engineer. You master Python, C, C++, HTML, CSS, JavaScript, Java, PHP, SQL, Rust, Go, TypeScript, React, Node.js, databases, AI development, and modern software engineering.

Provide accurate, clean, secure, scalable, and production-quality code. Explain solutions clearly. Adapt to beginner and advanced users. Never expose secrets or API keys.`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. AI Programmer Universal API accepts POST requests only.'
    });
  }

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
    let provider = 'groq';

    // Priority 1: Groq API (User requirement)
    if (groqApiKey && groqApiKey.trim() !== '') {
      try {
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
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

        const groqData = await groqRes.json();
        aiResponseText = groqData.choices?.[0]?.message?.content || 'No response returned from Groq API.';
        usedModel = groqData.model || model;
        provider = 'groq';
      } catch (groqErr) {
        console.error('Groq API Error:', groqErr.message);
        // If Groq fails and Gemini is available as fallback, use Gemini
        if (geminiApiKey) {
          console.log('Falling back to Gemini API...');
          aiResponseText = await callGeminiFallback(messages, systemPrompt, geminiApiKey);
          usedModel = 'gemini-3.8-flash (fallback)';
          provider = 'gemini';
        } else {
          return res.status(502).json({
            error: `Groq API Error: ${groqErr.message}. Verify that your GROQ_API_KEY is active and valid in your Vercel Environment Variables.`
          });
        }
      }
    } else if (geminiApiKey) {
      // In local preview/AI Studio environment before user pastes their Groq key
      console.log('No GROQ_API_KEY found, utilizing injected GEMINI_API_KEY for seamless preview...');
      try {
        aiResponseText = await callGeminiFallback(messages, systemPrompt, geminiApiKey);
        usedModel = 'gemini-3.8-flash (Groq fallback)';
        provider = 'gemini';
      } catch (geminiErr) {
        return res.status(500).json({
          error: `AI Error: ${geminiErr.message}. Please configure GROQ_API_KEY in your environment.`
        });
      }
    } else {
      return res.status(500).json({
        error: 'GROQ_API_KEY is not set in environment variables. Please add GROQ_API_KEY in your Vercel Project Settings > Environment Variables, or in your local .env file.'
      });
    }

    // Google Apps Script logging (if Web App URL is provided in env or request)
    let loggedToSheet = false;
    let sheetError = null;
    const sheetUrl = (googleSheetWebAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || '').trim();

    if (sheetUrl && sheetUrl.startsWith('http')) {
      try {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
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
          sheetError = `Status ${sheetRes.status}`;
        }
      } catch (shErr) {
        console.warn('Google Sheet logging error:', shErr.message);
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
  } catch (err) {
    console.error('Server error in /api/chat:', err);
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while processing the AI request.'
    });
  }
}

/**
 * Fallback to Gemini when GROQ_API_KEY is not yet added in environment
 */
async function callGeminiFallback(messages, systemPrompt, apiKey) {
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

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini did not return any candidate text.');
  }
  return text;
}
