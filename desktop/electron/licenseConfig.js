// licenseConfig.js (Electron main process)
//
// After you deploy the Google Apps Script (see /licensing/README.md at the
// project root and /licensing/AppsScript.gs for the code to paste), put the
// Web App URL it gives you here. Both the mobile app and this desktop app
// check against the same URL.

const LICENSE_API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// After a successful check, this device can keep working offline for this
// many days before it's required to reach the license server again.
const GRACE_PERIOD_DAYS = 5;

module.exports = { LICENSE_API_URL, GRACE_PERIOD_DAYS };
