/**
 * Baby Dedication Guest Confirmation - Google Form auto-setup.
 *
 * This script creates your Google Form AND its linked guest-list
 * spreadsheet automatically. No deployment or coding needed.
 *
 * HOW TO USE:
 * 1. Go to https://script.google.com/home and start a New project.
 * 2. Delete the default code, paste this whole file, save.
 * 3. Run the function  createGuestForm()  (top toolbar: Run > Run function>
 *    createGuestForm). Click through the permission steps (it only
 *    creates a spreadsheet + form for you).
 * 4. Open View > Logs (Execution log) and copy:
 *      - FORM LINK  -> share this with your guests,
 *      - EMBED URL  -> paste into script.js CONFIG.formUrl so the
 *        form appears inside the invitation itself.
 * 5. All responses automatically land in the spreadsheet ("Guest List").
 */

function createGuestForm() {
  var ss = SpreadsheetApp.create('Baby Dedication Guest List - Mateo Gray D. Delos Santos');

  var form = FormApp.create('Baby Dedication RSVP - Mateo Gray D. Delos Santos');
  form.setDescription(
    'Please confirm your attendance for the baby dedication of ' +
    'Mateo Gray D. Delos Santos on September 19, 2026.'
  );

  var nameItem = form.addTextItem();
  nameItem.setTitle('Full Name').setRequired(true);

  var phoneItem = form.addTextItem();
  phoneItem.setTitle('Contact Number (optional)');

  var attendItem = form.addMultipleChoiceItem();
  attendItem
    .setTitle('Will you attend?')
    .setChoiceValues(['Yes, I will attend', 'Sorry, cannot attend'])
    .setRequired(true);

  var guestsItem = form.addMultipleChoiceItem();
  guestsItem
    .setTitle('How many guests are coming with you?')
    .setChoiceValues([
      'Just me', '1', '2', '3', '4', '5', '6',
      '7', '8', '9', '10', '11 or more'
    ])
    .setRequired(true);

  var compItem = form.addParagraphTextItem();
  compItem
    .setTitle('Names of your companions (optional)')
    .setHelpText('Ex: Juan Dela Cruz, Maria Santos');

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  var shareLink = form.getPublishedUrl();
  var embedUrl = 'https://docs.google.com/forms/d/e/' + form.getId() + '/viewform?embedded=true';

  Logger.log('FORM LINK (share with guests): ' + shareLink);
  Logger.log('EMBED URL (paste into CONFIG.formUrl in script.js): ' + embedUrl);
  Logger.log('GUEST LIST SPREADSHEET: ' + ss.getUrl());
}