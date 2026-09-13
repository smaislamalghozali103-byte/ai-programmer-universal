/**
 * ============================================================================
 * AI PROGRAMMER UNIVERSAL - GOOGLE APPS SCRIPT WEB APP
 * ============================================================================
 * 
 * Description:
 * This script runs as a Google Apps Script Web App attached to your Google Sheet.
 * It listens for incoming HTTP POST requests from AI Programmer Universal
 * (Vercel Serverless Function or frontend) and records each conversation
 * turn into your Google Spreadsheet.
 * 
 * Spreadsheet Columns:
 * 1. Timestamp (ISO or localized date/time)
 * 2. SessionID (UUID or session identifier)
 * 3. UserMessage (User prompt / code snippet)
 * 4. AIResponse (AI programmer answer / solution)
 * 5. Model (e.g., llama-3.3-70b-versatile)
 * 
 * STEP-BY-STEP SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) and create a new spreadsheet.
 * 2. Name your spreadsheet (e.g., "AI Programmer Universal Logs").
 * 3. In the top menu, click: Extensions -> Apps Script.
 * 4. Delete any code in the script editor and paste this ENTIRE file.
 * 5. Click "Save project" (Ctrl+S or the disk icon).
 * 6. Click the blue "Deploy" button (top right) -> "New deployment".
 * 7. Click the gear icon next to "Select type" -> select "Web app".
 * 8. Set the configuration:
 *    - Description: AI Programmer Universal Logger
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial so Vercel can post without OAuth prompt)
 * 9. Click "Deploy". Authorize permissions if prompted by Google.
 * 10. Copy the "Web app URL" (ends with /exec).
 * 11. Paste this URL into your Vercel Environment Variables as GOOGLE_SHEET_WEBAPP_URL,
 *     or into the AI Programmer Universal UI Settings panel.
 * ============================================================================
 */

// Target Sheet name (default is the first sheet or "Conversations")
const SHEET_NAME = 'Conversations';

/**
 * Handles incoming POST requests containing conversation records
 */
function doPost(e) {
  try {
    let payload;
    
    // Parse incoming JSON body
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      payload = {};
    }

    const timestamp = payload.timestamp || Utilities.formatDate(new Date(), 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const sessionId = payload.sessionId || payload.session_id || 'anonymous_session';
    const userMessage = payload.userMessage || payload.user_message || payload.prompt || '';
    const aiResponse = payload.aiResponse || payload.ai_response || payload.response || '';
    const model = payload.model || 'groq-llama-3.3-70b';

    // Access active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // If sheet does not exist, create it and setup columns
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Check if header row exists
    if (sheet.getLastRow() === 0) {
      const headers = ['Timestamp', 'SessionID', 'UserMessage', 'AIResponse', 'Model'];
      sheet.appendRow(headers);

      // Style header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e293b');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Append conversation data
    sheet.appendRow([
      timestamp,
      sessionId,
      userMessage,
      aiResponse,
      model
    ]);

    // Format new row for better readability
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3, 1, 2).setWrap(true); // Wrap text on messages

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'success',
        message: 'Conversation logged successfully',
        row: lastRow,
        timestamp: timestamp,
        sessionId: sessionId
      })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    Logger.log('Error logging to spreadsheet: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: error.toString()
      })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

/**
 * Handles GET requests to verify the endpoint is online
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const totalRows = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'online',
      service: 'AI Programmer Universal Google Sheets Logger',
      spreadsheetName: ss.getName(),
      totalConversationsLogged: totalRows,
      instructions: 'Send HTTP POST with JSON body containing: { timestamp, sessionId, userMessage, aiResponse, model }'
    })
  )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}
