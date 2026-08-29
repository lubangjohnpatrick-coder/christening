/**
 * Christening Guest Confirmation - Google Apps Script backend.
 *
 * HOW TO USE:
 * 1. Create a Google Sheet (sheets.new) for your guest list.
 * 2. In that sheet: Extensions > Apps Script.
 * 3. Delete the default code and paste this whole file.
 * 4. Click Deploy > New deployment > Web app.
 *    - Description: "Guest RSVP"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Deploy, then copy the Web app URL and paste it into
 *    script.js (CONFIG.scriptUrl). Save and reload the invitation.
 *
 * Every confirmed request adds one new row to the active sheet,
 * which becomes your guest list.
 */

function doGet() {
  return ContentService
    .createTextOutput('Christening RSVP endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var response = { success: false };
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = [
      'Timestamp',
      'Full Name',
      'Contact Number',
      'Confirmation',
      'Number of Guests',
      'Companions (Guest Names)'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    var attendance = String(data.attend || '');
    var guestRow = [
      new Date(),
      String(data.name || '').trim(),
      String(data.phone || '').trim(),
      attendance,
      data.guestCount || 0,
      String(data.companions || '').trim()
    ];
    sheet.appendRow(guestRow);

    response.success = true;
  } catch (err) {
    response.success = false;
    response.error = String(err);
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}