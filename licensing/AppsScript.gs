// AppsScript.gs
//
// Setup:
// 1. Create a Google Sheet. Rename the first tab "Licenses".
// 2. Row 1 headers, exactly: LicenseKey | ShopName | Status | ExpiryDate
//    - LicenseKey: any string you assign per customer (e.g. AGRI-AHMAD-01)
//    - ShopName: shown back to the app after activation, for your reference
//    - Status: "Active" or "Revoked" (anything other than "Active" blocks it)
//    - ExpiryDate: a date (e.g. 2027-01-01), or leave blank for no expiry
// 3. Add one row per customer.
// 4. Extensions > Apps Script. Delete the placeholder code and paste this
//    whole file in. Save.
// 5. Deploy > New deployment > select type "Web app".
//    - Execute as: Me
//    - Who has access: Anyone
//    Deploy, authorize when prompted, then copy the Web App URL it gives you.
// 6. Paste that URL into app/src/license/licenseConfig.js as LICENSE_API_URL.
//
// To revoke a customer: change their Status cell to "Revoked" (or anything
// other than "Active") and save the sheet — no redeploy needed, takes
// effect the next time that device checks in.

function doGet(e) {
  var key = (e.parameter.key || '').trim();
  if (!key) {
    return respond({ valid: false, message: 'No license key provided.' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Licenses');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyCol = headers.indexOf('LicenseKey');
  var statusCol = headers.indexOf('Status');
  var expiryCol = headers.indexOf('ExpiryDate');
  var shopCol = headers.indexOf('ShopName');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyCol]).trim() === key) {
      var status = String(data[i][statusCol]).trim();
      var expiryRaw = data[i][expiryCol];
      var shopName = data[i][shopCol];

      logActivity(key, shopName, status);

      if (status !== 'Active') {
        return respond({ valid: false, message: 'This license has been deactivated. Contact your shop software provider.' });
      }

      if (expiryRaw) {
        var expiryDate = new Date(expiryRaw);
        var today = new Date();
        var formattedExpiry = Utilities.formatDate(expiryDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (expiryDate < today) {
          return respond({ valid: false, message: 'This license expired on ' + formattedExpiry + '. Contact your shop software provider to renew.' });
        }
        return respond({ valid: true, shopName: shopName, expiry: formattedExpiry });
      }

      return respond({ valid: true, shopName: shopName, expiry: null });
    }
  }

  logActivity(key, '(unknown key)', 'NOT FOUND');
  return respond({ valid: false, message: 'License key not found. Check for typos.' });
}

function logActivity(key, shopName, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName('ActivityLog');
    if (!log) {
      log = ss.insertSheet('ActivityLog');
      log.appendRow(['Timestamp', 'LicenseKey', 'ShopName', 'Status']);
    }
    log.appendRow([new Date(), key, shopName, status]);
  } catch (err) {
    // Logging is best-effort only — never let it block a license check.
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
