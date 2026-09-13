/**
 * Vercel Serverless Function: /api/test-sheet.js
 * Tests the connection to the Google Apps Script Web App
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body || {};
    const targetUrl = (url || process.env.GOOGLE_SHEET_WEBAPP_URL || '').trim();

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Valid Google Apps Script Web App URL is required.' });
    }

    const testPayload = {
      timestamp: new Date().toISOString(),
      sessionId: 'test_connection_' + Date.now(),
      userMessage: 'Test connection from AI Programmer Universal',
      aiResponse: 'Success! Your Google Spreadsheet connection is active and recording.',
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
  } catch (err) {
    console.error('Error testing Google Sheet connection:', err);
    return res.status(500).json({ error: err.message || 'Failed to connect to Google Sheet Web App' });
  }
}
