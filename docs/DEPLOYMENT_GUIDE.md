# AI Programmer Universal — Deployment & Integration Guide

This guide provides complete, production-ready instructions for deploying **AI Programmer Universal** to Vercel, integrating with Groq API, and automatically logging conversations to Google Sheets via Google Apps Script.

---

## 1. Vercel Deployment Instructions

### Method A: Deploy via GitHub (Recommended)
1. Push this repository to your GitHub account (`git push origin main`).
2. Log in to your [Vercel Dashboard](https://vercel.com).
3. Click **"Add New..."** -> **"Project"**.
4. Import your GitHub repository.
5. In the **Build and Output Settings**:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build` or `vite build`
   - Output Directory: `dist`
6. Expand **Environment Variables** (see section 2 below).
7. Click **"Deploy"**.
8. Your app is live with a global CDN frontend and serverless API at `https://your-project.vercel.app/api/chat`.

### Method B: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project and deploy
vercel

# 4. Deploy to Production with environment variables
vercel --prod
```

---

## 2. Environment Variable Setup Instructions

On Vercel, navigate to:
**Project Settings** -> **Environment Variables**

Add the following keys:

| Variable Name | Required | Description | Example Value |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | Your API key from Groq Cloud Console | `gsk_x9K...` |
| `GOOGLE_SHEET_WEBAPP_URL` | Optional | Google Apps Script Web App URL for spreadsheet logging | `https://script.google.com/macros/s/.../exec` |
| `GEMINI_API_KEY` | Optional | Fallback model key if Groq limits are reached | `AIzaSy...` |

### How to obtain your Groq API Key:
1. Go to [Groq Console](https://console.groq.com/keys).
2. Sign up or log in.
3. Click **"API Keys"** -> **"Create API Key"**.
4. Give it a name like `AI-Programmer-Universal`.
5. Copy the key and add it to your Vercel Environment Variables.

---

## 3. Google Spreadsheet Setup Instructions

AI Programmer Universal can store all coding sessions directly into your private Google Spreadsheet.

### Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.new).
2. Name your sheet: `AI Programmer Universal Logs`.
3. The script will automatically create the header columns on the first message:
   - `Timestamp`
   - `SessionID`
   - `UserMessage`
   - `AIResponse`
   - `Model`

### Step 2: Add Google Apps Script
1. In the Google Sheet, click **Extensions** -> **Apps Script**.
2. Delete the placeholder code in `Code.gs`.
3. Copy the entire contents of `google-apps-script.js` from this project and paste it into the editor.
4. Click **Save** (disk icon).

### Step 3: Deploy the Web App
1. Click **Deploy** -> **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the fields:
   - **Description**: `AI Programmer Universal Logger`
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: must be "Anyone" so Vercel serverless function can post records)*
4. Click **Deploy**.
5. When prompted, click **Authorize Access**, select your Google account, click **Advanced**, then **Go to Untitled project (unsafe)**, and click **Allow**.
6. Copy the resulting **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).
7. Paste this URL into your Vercel Environment Variable `GOOGLE_SHEET_WEBAPP_URL` or directly into the settings modal of the web app!

---

## 4. Security Best Practices

1. **Zero Secret Leakage in Frontend:**
   - The Groq API key is **never** bundled into the client-side JavaScript or HTML.
   - All browser requests target the relative backend route `/api/chat`.
   - Vercel Serverless Functions execute securely on Node.js runtime isolated from browser DevTools.

2. **CORS & Preflight Handling:**
   - The API restricts methods to `POST` and `OPTIONS`.
   - Protects against unauthorized execution or scraping.

3. **Input Sanitization & Length Restrictions:**
   - Message payloads are validated before sending to Groq.
   - Prevents prompt injection risks and runaway token limits.

4. **Spreadsheet Security:**
   - The Google Apps Script runs under your Google account execution context without exposing your Google Drive credentials or Google account password to any client.

---

## 5. Testing Instructions

### Test 1: Verify Vercel Serverless API via cURL
Run the following terminal command to test the backend API:

```bash
curl -X POST "https://your-project.vercel.app/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Write a clean Python function to calculate the Fibonacci sequence with memoization."
      }
    ],
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.2
  }'
```

Expected Response:
```json
{
  "response": "Here is an optimized Python function implementing Fibonacci with memoization...",
  "model": "llama-3.3-70b-versatile",
  "provider": "groq",
  "sessionId": "...",
  "loggedToSheet": false
}
```

### Test 2: Test Google Apps Script Web App via cURL
```bash
curl -L -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-09-13T12:00:00Z",
    "sessionId": "test-session-001",
    "userMessage": "Hello world in Rust",
    "aiResponse": "fn main() { println!(\"Hello, world!\"); }",
    "model": "llama-3.3-70b-versatile"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "message": "Conversation logged successfully",
  "row": 2
}
```

### Test 3: In-App Verification
1. Open the web application.
2. Click on the **Settings** or **Setup Hub** icon in the header.
3. Check the Status Indicators:
   - **Groq API**: Green when `GROQ_API_KEY` is loaded.
   - **Spreadsheet Sync**: Enter your Web App URL and click **"Test Connection"** to verify instantaneous row logging!
4. Select a language shortcut (e.g., **Rust**, **Python**, **C++**) and run an action like **"Code Review"** or **"Optimize"**.
